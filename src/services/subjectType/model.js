'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectTypeSchema = new Schema({
	name: { type: String, required: true },
	label: { type: String, required: true }
});

const subjectTypeModel = mongoose.model('subjecttype', subjectTypeSchema);

module.exports = subjectTypeModel;
