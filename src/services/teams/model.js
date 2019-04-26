const mongoose = require('mongoose');
const { permissionSchema } = require('../fileStorage/model');

const { Schema } = mongoose;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: { type: String, required: true },
		schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'school' },
		userIds: [{ type: Schema.Types.ObjectId, ref: 'user' }],
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	};

	return new Schema(Object.assign(schema, additional), {
		timestamps: true,
	});
};

/**
 * duration {Number} - the duration of a course lesson
 * startTime {Number] - the start time of a course lesson as milliseconds
 * weekday {Number} - from 0 to 6, the weekday the course take place
 *      (e.g. 0 = monday, 1 = tuesday ... )
 * eventId {String} - id of the event in the external calendar-service
 * room {String} - a specific location for the recurring course lesson, e.g. a room number
 */
const timeSchema = new Schema({
	weekday: {
		type: Number, min: 0, max: 6, required: true,
	},
	startTime: { type: Number },
	duration: { type: Number },
	eventId: { type: String },
	room: { type: String },
});

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
	classIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'class' }],
	// substitutionIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	// todo: add later
	ltiToolIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'ltiTool' }],
	color: { type: String, required: true, default: '#ACACAC' },
	startDate: { type: Date },
	untilDate: { type: Date },
	//  shareToken:  { type: String, unique: true },
	times: [timeSchema],
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
