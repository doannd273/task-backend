const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== CREATE CONVERSATION ====================
const createConversation = async (req, res) => {
  try {
    const { type, name, participantIds } = req.body;
    const currentUserId = req.user._id;

    if (!['private', 'group'].includes(type)) {
      return sendError(req, res, 400, 'CONVERSATION_INVALID_TYPE');
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return sendError(req, res, 400, 'CONVERSATION_PARTICIPANT_IDS_REQUIRED_ARRAY');
    }

    // Luôn bao gồm người tạo vào danh sách participants
    const participants = [...new Set([currentUserId.toString(), ...participantIds])];

    if (type === 'private' && participants.length !== 2) {
      return sendError(req, res, 400, 'CONVERSATION_PRIVATE_REQUIRES_TWO_PARTICIPANTS');
    }

    if (type === 'group' && !name) {
      return sendError(req, res, 400, 'CONVERSATION_GROUP_NAME_REQUIRED');
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
      return sendError(req, res, 400, 'CONVERSATION_INVALID_PARTICIPANTS');
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
    return sendError(req, res, 500, 'CONVERSATION_CREATE_FAILED');
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
    return sendError(req, res, 500, 'CONVERSATION_RETRIEVE_FAILED');
  }
};

// ==================== GET DETAILS ====================
const getConversationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return sendError(req, res, 400, 'CONVERSATION_INVALID_ID');

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    }).populate('participants', '_id email avatar phone');

    if (!conversation) {
      return sendError(req, res, 404, 'CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED');
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation details error:', error);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

// ==================== UPDATE CONVERSATION (RENAME) ====================
const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) return sendError(req, res, 400, 'CONVERSATION_INVALID_ID');
    if (!name) return sendError(req, res, 400, 'CONVERSATION_NAME_REQUIRED');

    const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
    
    if (!conversation) return sendError(req, res, 404, 'CONVERSATION_NOT_FOUND');
    if (conversation.type === 'private') return sendError(req, res, 400, 'CONVERSATION_PRIVATE_RENAME_FORBIDDEN');
    if (conversation.creator.toString() !== req.user._id.toString()) {
      return sendError(req, res, 403, 'CONVERSATION_CREATOR_RENAME_REQUIRED');
    }

    conversation.name = name;
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Update conversation error:', error);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

// ==================== DELETE CONVERSATION ====================
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return sendError(req, res, 400, 'CONVERSATION_INVALID_ID');

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation) return sendError(req, res, 404, 'CONVERSATION_NOT_FOUND');
    
    // Yêu cầu là người tạo mới được xoá, hoặc nếu là private thì cả 2 đều có quyền xoá lịch sử
    if (conversation.type === 'group' && conversation.creator.toString() !== req.user._id.toString()) {
      return sendError(req, res, 403, 'CONVERSATION_CREATOR_DELETE_REQUIRED');
    }
    
    if (conversation.type === 'private' && !conversation.participants.includes(req.user._id)) {
      return sendError(req, res, 403, 'COMMON_ACCESS_DENIED');
    }

    // Ở đây ta có thể xóa mềm hoặc cứng. Vì yêu cầu cơ bản, ta xoá cứng luôn (kéo theo phải xoá messages nữa).
    const Message = require('../models/Message');
    await Message.deleteMany({ conversationId: id });
    await Conversation.deleteOne({ _id: id });

    res.status(200).json({ success: true, data: { message: 'Conversation deleted' } });
  } catch (error) {
    console.error('Delete conv error:', error);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

// ==================== ADD/REMOVE PARTICIPANTS ====================
const addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // user để add

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation || conversation.type === 'private') {
      return sendError(req, res, 404, 'CONVERSATION_GROUP_NOT_FOUND');
    }
    
    if (conversation.creator.toString() !== req.user._id.toString()) {
      return sendError(req, res, 403, 'CONVERSATION_CREATOR_ADD_REQUIRED');
    }

    if (conversation.participants.includes(userId)) {
      return sendError(req, res, 400, 'CONVERSATION_USER_ALREADY_IN_GROUP');
    }

    conversation.participants.push(userId);
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Add participant error:', error);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

const removeParticipant = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const conversation = await Conversation.findOne({ _id: id });
    if (!conversation || conversation.type === 'private') {
      return sendError(req, res, 404, 'CONVERSATION_GROUP_NOT_FOUND');
    }
    
    // Có thể rời nếu userId = chính mình, nếu kích người khác thì phải là creator
    if (req.user._id.toString() !== userId && conversation.creator.toString() !== req.user._id.toString()) {
      return sendError(req, res, 403, 'COMMON_ACCESS_DENIED');
    }

    conversation.participants.pull(userId);
    await conversation.save();

    res.status(200).json({ success: true, data: { message: 'Participant removed' } });
  } catch (error) {
    console.error('Remove participant error:', error);
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
  }
};

const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({ _id: id, participants: req.user._id });
    if (!conversation) return sendError(req, res, 404, 'CONVERSATION_NOT_FOUND');
    
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
    return sendError(req, res, 500, 'COMMON_INTERNAL_ERROR');
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
