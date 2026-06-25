const MESSAGE_TYPES = Object.freeze(['text', 'image', 'video']);
const DEFAULT_MESSAGE_TYPE = 'text';

const isValidMessageType = (type) => MESSAGE_TYPES.includes(type);

module.exports = {
  MESSAGE_TYPES,
  DEFAULT_MESSAGE_TYPE,
  isValidMessageType,
};
