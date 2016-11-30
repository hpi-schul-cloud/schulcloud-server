'use strict';

// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ltiToolSchema = new Schema({
  name: { type: String },
  url: { type: String },
  key: { type: String },
  secret: { type: String },
  logo_url: { type: String },
  lti_message_type: { type: String, required: true },
  lti_version: { type: String, required: true },
  resource_link_id: { type: String, required: true },
  roles: { type: [{ type: String, enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'] }]},
  privacy_permission: { type: String, enum: ['anonymous', 'e-mail', 'name', 'public'], default: 'anonymous' },
  customs: {type: [{key: {type: String}, value: {type: String}}] },
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

ltiToolSchema.statics.customFieldToString = (custom) => {
  return `custom_${custom.key}`;
};

const ltiToolModel = mongoose.model('ltiTool', ltiToolSchema);

module.exports = ltiToolModel;
