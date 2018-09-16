'use strict';

// model.js - A mongoose model
// https://www.edu-apps.org/code.html - LTI Parameters
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ltiTool = new Schema({
  name: { type: String },
  url: { type: String, required: true },
  key: { type: String },
  secret: { type: String },
  logo_url: { type: String },
  lti_message_type: { type: String },
  lti_version: { type: String },
  resource_link_id: { type: String },
  roles: { type: [{ type: String, enum: ['Learner', 'Instructor', 'ContentDeveloper', 'Administrator', 'Mentor', 'TeachingAssistant'] }]},
  privacy_permission: { type: String, enum: ['anonymous', 'e-mail', 'name', 'public'], default: 'anonymous' },
  customs: {type: [{key: {type: String}, value: {type: String}}] },
  isTemplate: {type: Boolean},
  isLocal: {type: Boolean},
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now },
  originTool: { type: Schema.Types.ObjectId, ref: 'ltiTool'},
  oAuthClientId: { type: String }
});

const ltiToolModel = mongoose.model('ltiTool', ltiTool);

module.exports = ltiToolModel;
