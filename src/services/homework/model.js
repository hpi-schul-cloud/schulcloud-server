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
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
	updatedAt: { type: Date, default: Date.now },
	name: { type: String, required: true },
	description: { type: String },
	dueDate: { type: Date },
	availableDate: { type: Date, required: true },
	teacherId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	courseId: {
		type: Schema.Types.ObjectId,
		default: null,
		ref: 'course',
	},
	lessonId: { type: Schema.Types.ObjectId, default: null, ref: 'lesson' },
	private: { type: Boolean },
	publicSubmissions: { type: Boolean },
	teamSubmissions: { type: Boolean },
	maxTeamMembers: { type: Number, default: null, min: 1 },
	archived: [{ type: Schema.Types.ObjectId, ref: 'user' }],
});

/*
query list with bigges impact of database load
-> case for index see below by homeworkSchema
schulcloud.homeworks           find         {"archived": {"$ne": 1}, "courseId": 1} -> 1
schulcloud.homeworks           find         {"$and": [{"_id": 1}, {"private": {"$ne": 1}}]} -> 2
schulcloud.homeworks           find         {"archived": {"$ne": 1}, "schoolId": 1} -> 3
schulcloud.homeworks           find         {"lessonId": 1} -> 4
schulcloud.homeworks           find         {"$or": [{"dueDate": 1}, {"dueDate": 1}], "archived": {"$ne": 1}, "schoolId": 1} -> 5
schulcloud.homeworks           find         {"$or": [{"teacherId": 1}, {"courseId": 1}]} -> 6
*/
homeworkSchema.index({ dueDate: 1 }); // ok or = 5
homeworkSchema.index({ courseId: 1 }); // ok or = 6
homeworkSchema.index({ fileIds: 1 }); // ?
homeworkSchema.index({ private: 1 }); // ok = 2
homeworkSchema.index({ schoolId: 1 }); // ok or = 5
homeworkSchema.index({ archived: 1 }); // ok or = 5
homeworkSchema.index({ archived: 1, courseId: 1 }); // ok = 1
homeworkSchema.index({ teacherId: 1 }); // ok or = 6
homeworkSchema.index({ lessonId: 1 }); // ok = 4
homeworkSchema.index({ archived: 1, schoolId: 1 }); // ok = 3

const submissionSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	comment: { type: String },
	grade: { type: Number, min: 0, max: 100 },
	gradeComment: { type: String },
	homeworkId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'homework',
	},
	studentId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	teamMembers: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	courseGroupId: { type: Schema.Types.ObjectId, ref: 'courseGroup' },
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
	gradeFileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
});

/*
query list with bigges impact of database load
schulcloud.submissions         find         {"$and": [{"teamMembers": 1}, {"studentId": {"$ne": 1}}] -> 1
*/
submissionSchema.index({ schoolId: 1 }); // ?
submissionSchema.index({ homeworkId: 1 }); // ?
submissionSchema.index({ fileIds: 1 }); // ?
submissionSchema.index({ gradeFileIds: 1 }); // ?
submissionSchema.index({ studentId: 1, teamMembers: 1 }); // ok = 1

enableAuditLog(homeworkSchema);
enableAuditLog(submissionSchema);

const homeworkModel = mongoose.model('homework', homeworkSchema);
const submissionModel = mongoose.model('submission', submissionSchema);

module.exports = {
	homeworkModel,
	submissionModel,
	SubmissionSchema: submissionSchema,
};
