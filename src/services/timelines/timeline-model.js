'use strict';

// timelines-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const timelineSchema = new Schema({
	title: {type: String, required: true},
	fetchUrl: {type: String, required: true},
	documentUrl: {type: String, required: true},
	json: {type: String, required: true}
});

const timelineModel = mongoose.model('timeline', timelineSchema);
module.exports = timelineModel;
