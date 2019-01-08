const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
    pass: { type: String, required: true },
    username:{ type: String, required: true, unique: true },
}, { timestamps: true });

const channelSchema = new Schema({
    teamId: { type: Schema.Types.ObjectId, ref: 'team', required: true, unique: true }, //toDo: make flexible reference, example see fileStorage
    channelName: {type: String, required: true}
}, { timestamps: true });

const userModel = mongoose.model('rocketChatUser', userSchema);
const channelModel = mongoose.model('rocketChatChannel', channelSchema);

module.exports = {userModel, channelModel};
