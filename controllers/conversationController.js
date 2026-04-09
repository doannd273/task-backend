const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== CREATE CONVERSATION ====================
const createConversation = async (req, res) => {
  try {
    const { type, name, participantIds } = req.body;
    const currentUserId = req.user._id;

    if (!['private', 'group'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation type' });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ success: false, message: 'participantIds must be an array' });
    }

    // Luôn bao gồm người tạo vào danh sách participants
    const participants = [...new Set([currentUserId.toString(), ...participantIds])];

    if (type === 'private' && participants.length !== 2) {
      return res.status(400).json({ success: false, message: 'Private conversation requires exactly 2 participants' });
    }

    if (type === 'group' && !name) {
      return res.status(400).json({ success: false, message: 'Group conversation requires a name' });
    }

    // Nếu là chat private, kiểm tra xem đã tồn tại chưa
    if (type === 'private') {
      const existingConv = await Conversation.findOne({
        type: 'private',
        participants: { $all: participants, $size: 2 },
      });

      if (existingConv) {
        return res.status(200).json({ success: true, data: existingConv });
      }
    }

    // Validate participants
    const usersCount = await User.countDocuments({ _id: { $in: participants } });
    if (usersCount !== participants.length) {
      return res.status(400).json({ success: false, message: 'One or more invalid participant IDs' });
    }

    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : '',
      creator: currentUserId,
      participants,
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// ==================== GET CONVERSATIONS ====================
const getConversations = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const filter = { participants: req.user._id };

    const totalItems = await Conversation.countDocuments(filter);
    // Populate participants info to easily show avatars/names
    const conversations = await Conversation.find(filter)
      .populate('participants', '_id email avatar phone')
      .populate('lastMessage.senderId', '_id email avatar')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        conversations,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations' });
  }
};

// ==================== GET DETAILS ====================
const getConversationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    }).populate('participants', '_id email avatar phone');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== UPDATE CONVERSATION (RENAME) ====================
const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
    
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (conversation.type === 'private') return res.status(400).json({ success: false, message: 'Cannot rename private conversation' });
    if (conversation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can rename' });
    }

    conversation.name = name;
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== DELETE CONVERSATION ====================
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    
    // Yêu cầu là người tạo mới được xoá, hoặc nếu là private thì cả 2 đều có quyền xoá lịch sử
    if (conversation.type === 'group' && conversation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can delete this conversation' });
    }
    
    if (conversation.type === 'private' && !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Ở đây ta có thể xóa mềm hoặc cứng. Vì yêu cầu cơ bản, ta xoá cứng luôn (kéo theo phải xoá messages nữa).
    const Message = require('../models/Message');
    await Message.deleteMany({ conversationId: id });
    await Conversation.deleteOne({ _id: id });

    res.status(200).json({ success: true, data: { message: 'Conversation deleted' } });
  } catch (error) {
    console.error('Delete conv error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== ADD/REMOVE PARTICIPANTS ====================
const addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // user để add

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation || conversation.type === 'private') {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    if (conversation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only creator can add participants' });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already in group' });
    }

    conversation.participants.push(userId);
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeParticipant = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation || conversation.type === 'private') {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    // Có thể rời nếu userId = chính mình, nếu kích người khác thì phải là creator
    if (req.user._id.toString() !== userId && conversation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    conversation.participants.pull(userId);
    await conversation.save();

    res.status(200).json({ success: true, data: { message: 'Participant removed' } });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    
    // Thủ thuật pagination list nhúng:
    const totalItems = conversation.participants.length;
    const pIds = conversation.participants.slice(skip, skip + limit);
    
    const users = await User.find({ _id: { $in: pIds } }).select('_id email avatar phone');
    
    res.status(200).json({
      success: true, 
      data: {
        users,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationDetails,
  updateConversation,
  deleteConversation,
  addParticipant,
  removeParticipant,
  getParticipants
};
