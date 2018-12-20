const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    pass: { type: String, required: true },
    username:{ type: String, required: true, unique: true },
}, { timestamps: true });

const channelSchema = new Schema({
    teamId: { type: Schema.Types.ObjectId, ref: 'team', required: true, unique: true },
    channelName: {type: String, required: true}
}, { timestamps: true });

const UserModel = mongoose.model('rocketChatUser', userSchema);
const ChannelModel = mongoose.model('rocketChatChannel', channelSchema);

module.exports = {UserModel, ChannelModel};
