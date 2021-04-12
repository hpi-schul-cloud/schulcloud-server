const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const targetModels = ['courses', 'events'];
// const rolesEnum = ['courseStudent', 'courseTeacher']; // todo: complete for course and team/event-roles

// todo create index on targetModel and target

const videoconferenceSchema = new Schema(
	{
		target: {
			type: String,
			// target and targetModel must both be defined or not
			required: function requiredTarget() {
				return !!this.targetModel;
			},
		},
		targetModel: {
			type: String,
			enum: targetModels,
			// target and targetModel must both be defined or not
			required: function requiredTargetModel() {
				return !!this.target;
			},
		},
		options: {
			moderatorMustApproveJoinRequests: {
				type: Boolean,
				default: false,
				required: true,
			},
			everybodyJoinsAsModerator: {
				type: Boolean,
				default: false,
				required: true,
			},
			everyAttendeJoinsMuted: {
				type: Boolean,
				default: false,
				required: true,
			},
		},
	},
	{
		timestamps: true,
	}
);
/*
query list with biggest impact of database load
schulcloud.videoconferences    find         {"target": 1, "targetModel": 1} -> 1
*/
// only work with both by generic model path
videoconferenceSchema.index({ target: 1 }); // ok = 1
videoconferenceSchema.index({ target: 1, targetModel: 1 }); // ok = 1

enableAuditLog(videoconferenceSchema);

const videoConferenceModel = mongoose.model('videoconference', videoconferenceSchema);

module.exports = videoConferenceModel;
