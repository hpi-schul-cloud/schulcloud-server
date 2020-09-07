const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const userSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			unique: true,
		},
		username: { type: String, required: true, unique: true },
		rcId: { type: String, required: true },
		authToken: { type: String },
	},
	{ timestamps: true }
);

const channelSchema = new Schema(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: 'team',
			required: true,
			unique: true,
		}, // toDo: make flexible reference, example see fileStorage
		channelName: { type: String, required: true },
	},
	{ timestamps: true }
);

enableAuditLog(userSchema);
enableAuditLog(channelSchema);

const userModel = mongoose.model('rocketChatUser', userSchema);
const channelModel = mongoose.model('rocketChatChannel', channelSchema);

module.exports = { userModel, channelModel };
