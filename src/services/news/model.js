'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsSchema = new Schema({
	schoolId: {type: Schema.Types.ObjectId, required: true},
	title: {type: String, required: true},
	content: {type: String, required: true},
	url: {type: String, required: true},
	createdAt: {type: Date, 'default': Date.now}
},{
	timestamps: true
});

const newsModel = mongoose.model('newsEntry', newsSchema);

module.exports = newsModel;