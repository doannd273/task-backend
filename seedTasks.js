require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');

const seedTasks = async () => {
  await connectDB();

  try {
    // Tìm một user bất kỳ để gán task
    const user = await User.findOne();
    if (!user) {
      console.log('❌ Không tìm thấy user nào trong database. Hãy tạo ít nhất 1 user trước!');
      process.exit(1);
    }

    const tasksToInsert = [];
    const statuses = ['todo', 'in_progress', 'pending', 'done'];

    for (let i = 1; i <= 50; i++) {
        // Tạo một ngày due date ngẫu nhiên từ quá khứ hoặc tương lai gần
        const randomDays = Math.floor(Math.random() * 30) - 10; // -10 đến +20 ngày
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + randomDays);
        
        // Trạng thái ngẫu nhiên
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        tasksToInsert.push({
            userId: user._id,
            title: `Task tự động tạo số ${i}`,
            description: `Đây là mô tả chi tiết cho task số ${i}. Dùng để tạo dữ liệu giả lập cho việc test ứng dụng gốc trên Android, như test RecyclerView, Pagination, etc.`,
            status: randomStatus,
            dueDate: dueDate,
        });
    }

    // Xóa tất cả tasks hiện tại (nếu muốn, có thể comment lại dòng này)
    // await Task.deleteMany({});
    // console.log('Đã xóa tất cả các tasks cũ (tuỳ chọn).');

    // Chèn 50 bản ghi
    await Task.insertMany(tasksToInsert);
    console.log(`✅ Đã thêm thành công ` + tasksToInsert.length + ` tasks cho user: ${user.email || user._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi chèn dữ liệu:', error);
    process.exit(1);
  }
};

seedTasks();
