'use strict';

// helpdesk-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categories = ['dashboard', 'courses', 'classes', 'calendar', 'homework', 'files', 'content', 'administration', 'login_registration', 'other', 'technical_problem'];
const states = ['open', 'closed', 'submitted'];

const problemSchema = new Schema({
	subject: {type: String, required: true},
	category: {type: String, enum: categories},
	currentState : {type: String},
	targetState: {type: String},
	state: {type: String, enum: states, default: 'open'},
	notes: {type: String},
	order: {type: Number, default: 0},
	userId: {type: Schema.Types.ObjectId, ref: 'user'},
	schoolId: {type: Schema.Types.ObjectId, ref: 'school', required: true},
	forwardedAt: {type: Date},
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const problemModel = mongoose.model('problem', problemSchema);

module.exports = problemModel;
