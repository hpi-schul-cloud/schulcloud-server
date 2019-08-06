// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const lessonSchema = new Schema({
	name: { type: String, required: true },
	description: { type: String },
	date: { type: Date },
	time: { type: Date },
	contents: [{
		user: { type: Schema.ObjectId, ref: 'user' },
		component: { type: String },
		title: { type: String },
		content: { },
		hidden: { type: Boolean },
	}],
	materialIds: [{ type: Schema.Types.ObjectId, ref: 'material' }],
	/** a lesson can be inside a course or a courseGroup */
	courseId: { type: Schema.Types.ObjectId, ref: 'course' },
	courseGroupId: { type: Schema.Types.ObjectId, ref: 'courseGroup' },
	teamId: { type: Schema.Types.ObjectId, ref: 'team' },
	hidden: { type: Boolean },
	// token for topic sharing
	shareToken: { type: String, unique: true, sparse: true },
	// if current topic was copied from another, for later fancy stuff
	isCopyFrom: { type: Schema.Types.ObjectId, default: null },
	position: { type: Number, default: 0, required: true },
}, {
	timestamps: true,
});

const lessonModel = mongoose.model('lesson', lessonSchema);

module.exports = lessonModel;
