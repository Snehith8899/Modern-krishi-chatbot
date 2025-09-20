import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    userId: String,
    query: String,
    reply: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;