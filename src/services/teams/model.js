'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name:      { type: String, required: true },
		schoolId:  { type: Schema.Types.ObjectId, required: true },
		userIds:   [{ type: Schema.Types.ObjectId, ref: 'user' }],
		createdAt: { type: Date, 'default': Date.now },
		updatedAt: { type: Date, 'default': Date.now }
	};

	return new Schema(Object.assign(schema, additional), {
		timestamps: true
	});
};

/**
 * duration {Number} - the duration of a course lesson
 * startTime {Number] - the start time of a course lesson as milliseconds
 * weekday {Number} - from 0 to 6, the weekday the course take place (e.g. 0 = monday, 1 = tuesday ... )
 * eventId {String} - id of the event in the external calendar-service
 * room {String} - a specific location for the recurring course lesson, e.g. a room number
 */
const timeSchema = new Schema({
	weekday:   { type: Number, min: 0, max: 6, required: true },
	startTime: { type: Number },
	duration:  { type: Number },
	eventId:   { type: String },
	room:      { type: String }
});


const teamUserModel = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'user' },
	role:   { type: Schema.Types.ObjectId, ref: 'role' }//,    	//todo: existing team roles not all	
	//roleName:{ type: String }								//todo: only pass roles that have name.substring(0,4)==='team'
},{ _id : false });

const teamsModel = mongoose.model('teams', getUserGroupSchema({
	//@override
	schoolIds: {
		type: Array,
		required: true/* todo:
		validate: {
			validator: function (array) {
				return array.length > 0 && array.every((v) => v instanceof Schema.Types.ObjectId);
			}
		}*/
	}, 
	//@override
	userIds:     [teamUserModel],
	description: { type: String },
	classIds:    [{ type: Schema.Types.ObjectId, required: true, ref: 'class' }],
//	substitutionIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],  todo: add later
	ltiToolIds:  [{ type: Schema.Types.ObjectId, required: true, ref: 'ltiTool' }],
	color:       { type: String, required: true, 'default': '#1DE9B6' },
	startDate:   { type: Date },
	untilDate:   { type: Date },
//	shareToken:  { type: String, unique: true },
	times:       [timeSchema],
	features:    [{ type: String, enum: ['isTeam'] }]
}));

module.exports = {
	teamsModel
}