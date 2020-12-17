const mongoose = require('mongoose');
const { permissionSchema } = require('../fileStorage/model');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const TEAM_FEATURES = {
	IS_TEAM: 'isTeam',
	ROCKET_CHAT: 'rocketChat',
	VIDEOCONFERENCE: 'videoconference',
	MESSENGER: 'messenger',
};

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: { type: String, required: true, trim: true },
		schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'school' },
		userIds: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	};

	return new Schema(Object.assign(schema, additional), {
		timestamps: true,
	});
};

const teamInvitedUserSchema = new Schema(
	{
		email: { type: String, required: true },
		role: { type: String, required: true, enum: ['teamexpert', 'teamadministrator'] },
	},
	{ _id: false, timestamps: true }
);

const teamUserSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
		role: { type: Schema.Types.ObjectId, ref: 'role', required: true },
		schoolId: { type: Schema.Types.ObjectId, ref: 'school', required: true },
	},
	{ _id: false, timestamps: true }
);

const teamsSchema = getUserGroupSchema({
	schoolIds: {
		type: [{ type: Schema.Types.ObjectId, ref: 'school' }],
		required: true,
	},
	// @override
	userIds: [teamUserSchema],
	invitedUserIds: [teamInvitedUserSchema],
	description: { type: String, default: '', trim: true },
	classIds: [{ type: Schema.Types.ObjectId, ref: 'class' }],
	color: { type: String, default: '#ACACAC' },
	features: [{ type: String, enum: Object.values(TEAM_FEATURES) }],
	filePermission: [permissionSchema],
});

enableAuditLog(teamsSchema);

const teamInvitedUserModel = mongoose.model('_teamInvitedUserSchema', teamInvitedUserSchema);
const teamUserModel = mongoose.model('_teamUserSchema', teamUserSchema);
const teamsModel = mongoose.model('teams', teamsSchema);

module.exports = {
	TEAM_FEATURES,
	teamsModel,
	permissionSchema,
	teamInvitedUserModel,
	teamUserModel,
};
