'use strict';

// link-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkSchema = new Schema({
	id: {type: String, required: true, unique: true},
	target: {type: String, required: true},
	createdAt: {type: Date, 'default': Date.now}
});

const linkModel = mongoose.model('link', linkSchema);
linkModel.linkLength = 5;
module.exports = linkModel;
