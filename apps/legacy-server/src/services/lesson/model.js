// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;

const lessonSchema = new Schema(
	{
		name: { type: String, required: true },
		description: { type: String },
		date: { type: Date },
		time: { type: Date },
		contents: [
			{
				user: { type: Schema.ObjectId, ref: 'user' },
				component: { type: String },
				title: { type: String },
				content: {},
				hidden: { type: Boolean },
			},
		],
		materialIds: [{ type: Schema.Types.ObjectId, ref: 'material' }],
		/** a lesson can be inside a course or a courseGroup */
		courseId: { type: Schema.Types.ObjectId, ref: 'course' },
		courseGroupId: { type: Schema.Types.ObjectId, ref: 'courseGroup' },
		teamId: { type: Schema.Types.ObjectId, ref: 'team' },
		hidden: { type: Boolean, default: true },
		// token for topic sharing
		shareToken: { type: String, unique: true, sparse: true },
		// if current topic was copied from another, for later fancy stuff
		isCopyFrom: { type: Schema.Types.ObjectId, default: null },
		position: { type: Number, default: 0, required: true },
	},
	{
		timestamps: true,
	}
);

/*
query list with bigges impact of database load
schulcloud.lessons             find         {"courseId": 1} 
schulcloud.lessons             find         {"courseGroupId": 1}
schulcloud.lessons             count        {"courseId": 1}        
*/
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ courseGroupId: 1 });

enableAuditLog(lessonSchema);

const LessonModel = mongoose.model('lesson', lessonSchema);

module.exports = {
	LessonModel,
	lessonSchema,
};
