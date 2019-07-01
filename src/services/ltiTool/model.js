// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const ltiTool = new Schema({
	name: { type: String },
	url: { type: String, required: true },
	key: { type: String, required: true },
	secret: { type: String, required: true },
	logo_url: { type: String },
	lti_message_type: { type: String, required: true },
	lti_version: { type: String, required: true },
	resource_link_id: { type: String, required: true },
	roles: { type: [{ type: String, enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'] }] },
	privacy_permission: { type: String, enum: ['anonymous', 'e-mail', 'name', 'public'], default: 'anonymous' },
	customs: { type: [{ key: { type: String }, value: { type: String } }] },
	isTemplate: { type: Boolean },
	isLocal: { type: Boolean },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool' },
	oAuthClientId: { type: String },
	useIframePseudonym: { type: Boolean },
});

const ltiToolModel = mongoose.model('ltiTool', ltiTool);

module.exports = ltiToolModel;
