const { runDueDateReminder } = require('../jobs/dueDateReminderJob');
const { sendError } = require('../utils/response');

const triggerDueDateReminder = async (req, res) => {
  try {
    await runDueDateReminder();
    return res.status(200).json({
      success: true,
      message: 'Due date reminder job triggered successfully.',
    });
  } catch (error) {
    console.error('Trigger due date reminder error:', error.message);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

module.exports = { triggerDueDateReminder };
