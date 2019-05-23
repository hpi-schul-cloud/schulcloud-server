const mongoose = require('mongoose');
const { permissionSchema } = require('../fileStorage/model');

const { Schema } = mongoose;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: { type: String, required: true },
		schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'school' },
		userIds: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	};

	return new Schema(Object.assign(schema, additional), {
		timestamps: true,
	});
};

const teamInvitedUserSchema = new Schema({
	email: { type: String, required: true },
	role: { type: String, required: true, enum: ['teamexpert', 'teamadministrator'] },
}, { _id: false, timestamps: true });

const teamInvitedUserModel = mongoose.model('_teamInvitedUserSchema', teamInvitedUserSchema);

const teamUserSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
	role: { type: Schema.Types.ObjectId, ref: 'role', required: true },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school', required: true },
}, { _id: false, timestamps: true });

const teamUserModel = mongoose.model('_teamUserSchema', teamUserSchema);

const teamsSchema = getUserGroupSchema({
	schoolIds: {
		type: [{ type: Schema.Types.ObjectId, ref: 'school' }],
		required: true,
	},
	// @override
	userIds: [teamUserSchema],
	invitedUserIds: [teamInvitedUserSchema],
	description: { type: String, default: '' },
	classIds: [{ type: Schema.Types.ObjectId, ref: 'class' }],
	color: { type: String, default: '#ACACAC' },
	features: [{ type: String, enum: ['isTeam', 'rocketChat'] }],
	filePermission: [permissionSchema],
});

const teamsModel = mongoose.model('teams', teamsSchema);

module.exports = {
	teamsModel,
	permissionSchema,
	teamInvitedUserModel,
	teamUserModel,
};
