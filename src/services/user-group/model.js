const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const getUserGroupSchema = (additional = {}) => {
	const schema = {
		name: { type: String, required: true },
		schoolId: { type: Schema.Types.ObjectId, required: true },
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
 * weekday {Number} - from 0 to 6, the weekday the course take place (e.g. 0 = monday, 1 = tuesday ... )
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

const courseSchema = getUserGroupSchema({
	description: { type: String },
	classIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'class' }],
	teacherIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	substitutionIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	ltiToolIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'ltiTool' }],
	color: { type: String, required: true, default: '#ACACAC' },
	startDate: { type: Date },
	untilDate: { type: Date },
	shareToken: { type: String, unique: true, sparse: true },
	times: [timeSchema],
	// optional information if this course is a copy from other
	isCopyFrom: { type: Schema.Types.ObjectId, default: null },
});

courseSchema.plugin(require('mongoose-lean-virtuals'));
enableAuditLog(courseSchema);

const getCourseIsArchived = (aCourse) => {
	const oneDayInMilliseconds = 864e5;

	if (aCourse.untilDate <= Date.now() - oneDayInMilliseconds) {
		return true;
	}
	return false;
};

// => has no access to this
// eslint-disable-next-line func-names
courseSchema.virtual('isArchived').get(function () {
	return getCourseIsArchived(this);
});

courseSchema.set('toObject', { virtuals: true });
courseSchema.set('toJSON', { virtuals: false }); // virtuals could not call with autopopulate for toJSON

const courseModel = mongoose.model('course', courseSchema);
const courseGroupSchema = getUserGroupSchema({
	courseId: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
});
enableAuditLog(courseGroupSchema);
// represents a sub-group of students inside a course, e.g. for projects etc.
const courseGroupModel = mongoose.model('courseGroup', courseGroupSchema);

const classSchema = getUserGroupSchema({
	teacherIds: [{ type: Schema.Types.ObjectId, ref: 'user', required: true }],
	invitationLink: { type: String },
	name: { type: String },
	year: { type: Schema.Types.ObjectId, ref: 'year' },
	gradeLevel: {
		type: Number,
		required: false,
		min: 1,
		max: 13,
	},
	ldapDN: { type: String },
	successor: { type: Schema.Types.ObjectId, ref: 'classes' },
});

classSchema.plugin(require('mongoose-lean-virtuals'));
enableAuditLog(classSchema);

const getClassDisplayName = (aClass) => {
	if (aClass.gradeLevel) {
		return `${aClass.gradeLevel}${aClass.name || ''}`;
	}

	return aClass.name;
};

classSchema.virtual('displayName').get(function displayName() {
	return getClassDisplayName(this);
});

classSchema.set('toObject', { virtuals: true });
classSchema.set('toJSON', { virtuals: true }); // virtuals could not call with autopopulate for toJSON

const classModel = mongoose.model('class', classSchema);

const gradeSchema = getUserGroupSchema();

enableAuditLog(gradeSchema);

const gradeModel = mongoose.model('grade', gradeSchema);

module.exports = {
	courseModel,
	courseGroupModel,
	classModel,
	gradeModel,
	getClassDisplayName,
};
