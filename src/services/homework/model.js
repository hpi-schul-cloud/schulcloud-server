// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const homeworkSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file', index: true }],
	updatedAt: { type: Date, default: Date.now },
	name: { type: String, required: true },
	description: { type: String },
	dueDate: { type: Date, index: true },
	availableDate: { type: Date, required: true },
	teacherId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	courseId: {
		type: Schema.Types.ObjectId, default: null, ref: 'course', index: true,
	},
	lessonId: { type: Schema.Types.ObjectId, default: null, ref: 'lesson' },
	private: { type: Boolean },
	publicSubmissions: { type: Boolean },
	teamSubmissions: { type: Boolean },
	maxTeamMembers: { type: Number, default: null, min: 1 },
	archived: [{ type: Schema.Types.ObjectId, ref: 'user' }],
});

const submissionSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	comment: { type: String },
	grade: { type: Number, min: 0, max: 100 },
	gradeComment: { type: String },
	homeworkId: {
		type: Schema.Types.ObjectId, required: true, ref: 'homework', index: true,
	},
	studentId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	teamMembers: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	courseGroupId: { type: Schema.Types.ObjectId, ref: 'courseGroup' },
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file', index: true }],
	comments: [{ type: Schema.Types.ObjectId, ref: 'comment' }],
});


const commentSchema = new Schema({
	comment: { type: String, required: true },
	submissionId: { type: Schema.Types.ObjectId, required: true, ref: 'submission' },
	createdAt: { type: Date, default: Date.now },
	author: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
});

enableAuditLog(homeworkSchema);
enableAuditLog(submissionSchema);
enableAuditLog(commentSchema);

const homeworkModel = mongoose.model('homework', homeworkSchema);
const submissionModel = mongoose.model('submission', submissionSchema);
const commentModel = mongoose.model('comment', commentSchema);

module.exports = {
	homeworkModel,
	submissionModel,
	commentModel,
};
