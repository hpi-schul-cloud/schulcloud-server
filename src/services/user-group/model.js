const autoPopulate = require('mongoose-autopopulate');
const mongoose = require('mongoose');
const logger = require('../../logger');

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

const courseModel = mongoose.model('course', getUserGroupSchema({
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
}));

// represents a sub-group of students inside a course, e.g. for projects etc.
const courseGroupModel = mongoose.model('courseGroup', getUserGroupSchema({
	courseId: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
}));

const nameFormats = ['static', 'gradeLevel+name'];

const classSchema = getUserGroupSchema({
	teacherIds: [{ type: Schema.Types.ObjectId, ref: 'user', required: true }],
	invitationLink: { type: String },
	name: { type: String, required: false },
	year: { type: Schema.Types.ObjectId, ref: 'year' },
	gradeLevel: { type: Schema.Types.ObjectId, ref: 'gradeLevel', autopopulate: true },
	nameFormat: { type: String, enum: nameFormats, default: 'static' },
	ldapDN: { type: String },
});

classSchema.plugin(autoPopulate);
classSchema.plugin(require('mongoose-lean-virtuals'));

const getClassDisplayName = (aclass) => {
	// for static classes
	if (aclass.nameFormat === 'static') {
		return aclass.name;
	}

	// for non static classes
	if (
		aclass.nameFormat === 'gradeLevel+name'
        && typeof aclass.gradeLevel === 'object'
        && (aclass.gradeLevel || {}).name
	) {
		return `${aclass.gradeLevel.name}${aclass.name}`;
	}

	// error handling
	if (!aclass.nameFormat) {
		logger.warning(`unknown nameFormat in class${aclass._id}`);
	} else {
		logger
			.warning(`The gradeLevel in class ${aclass._id} do not exist, or is is not populated.`, aclass.nameFormat);
	}

	return aclass;
};

// => has no access to this
// eslint-disable-next-line func-names
classSchema.virtual('displayName').get(function () {
	return getClassDisplayName(this);
});

classSchema.set('toObject', { virtuals: true });
classSchema.set('toJSON', { virtuals: false }); // virtuals could not call with autopopulate for toJSON

const classModel = mongoose.model('class', classSchema);
const gradeModel = mongoose.model('grade', getUserGroupSchema());

module.exports = {
	courseModel,
	courseGroupModel,
	classModel,
	gradeModel,
	getClassDisplayName,
};
