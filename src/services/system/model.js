'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['moodle'];

const systemSchema = new Schema({
	type: { type: String, required: true, enum: types },
	url: {type: String, required: false},
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now }
});

const systemModel = mongoose.model('system', systemSchema);

module.exports = systemModel;
