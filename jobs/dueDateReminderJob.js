const cron = require('node-cron');
const Task = require('../models/Task');
const DeviceToken = require('../models/DeviceToken');
const { sendFcmNotification } = require('../utils/fcmSender');

// Dates stored in MongoDB as UTC. Vietnamese clients typically save midnight UTC+7,
// so all range boundaries are computed relative to UTC+7 then converted back to UTC.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const getTodayBoundariesUTC = () => {
  const nowInVN = new Date(Date.now() + VN_OFFSET_MS);
  const midnightTodayUTC = new Date(
    Date.UTC(nowInVN.getUTCFullYear(), nowInVN.getUTCMonth(), nowInVN.getUTCDate()) - VN_OFFSET_MS
  );
  const midnightTomorrowUTC = new Date(midnightTodayUTC.getTime() + 24 * 60 * 60 * 1000);
  const midnightDayAfterUTC = new Date(midnightTodayUTC.getTime() + 2 * 24 * 60 * 60 * 1000);
  return { midnightTodayUTC, midnightTomorrowUTC, midnightDayAfterUTC };
};

const runDueDateReminder = async () => {
  const { midnightTodayUTC, midnightTomorrowUTC, midnightDayAfterUTC } = getTodayBoundariesUTC();

  const tasks = await Task.find({
    dueDate: { $gte: midnightTodayUTC, $lt: midnightDayAfterUTC },
    status: { $ne: 'done' },
  }).lean();

  if (tasks.length === 0) {
    console.log('[DueDateReminder] No tasks due today or tomorrow.');
    return;
  }

  let sentCount = 0;
  let failCount = 0;

  for (const task of tasks) {
    const dueToday = task.dueDate >= midnightTodayUTC && task.dueDate < midnightTomorrowUTC;
    const title = dueToday ? '⏰ Task due today!' : '📅 Task due tomorrow';
    const body = task.title;
    const data = {
      taskId: task._id.toString(),
      type: 'DUE_DATE_REMINDER',
    };

    const deviceTokens = await DeviceToken.find({ userId: task.userId }).lean();

    for (const dt of deviceTokens) {
      try {
        await sendFcmNotification(dt.token, title, body, data);
        sentCount++;
      } catch (err) {
        failCount++;
        const isStaleToken =
          err.code === 'messaging/registration-token-not-registered' ||
          err.code === 'messaging/invalid-registration-token';

        if (isStaleToken) {
          console.warn(`[DueDateReminder] Stale token removed: ${dt.token.slice(0, 20)}...`);
          await DeviceToken.deleteOne({ _id: dt._id }).catch(() => {});
        } else {
          console.error(`[DueDateReminder] FCM send failed for token ${dt.token.slice(0, 20)}...:`, err.message);
        }
      }
    }
  }

  console.log(`[DueDateReminder] Done — tasks: ${tasks.length}, sent: ${sentCount}, failed: ${failCount}`);
};

const scheduleDueDateReminder = () => {
  // 8:00 AM Asia/Ho_Chi_Minh mỗi ngày
  cron.schedule('0 8 * * *', async () => {
    console.log('[DueDateReminder] Running...');
    try {
      await runDueDateReminder();
    } catch (err) {
      console.error('[DueDateReminder] Cron error:', err.message);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log('[DueDateReminder] Scheduled at 08:00 Asia/Ho_Chi_Minh');
};

module.exports = { scheduleDueDateReminder, runDueDateReminder };
