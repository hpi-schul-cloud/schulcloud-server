'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schoolSchema = new Schema({
	name: {type: String, required: true},
	address: {type: Object},
	systems: [{type: Schema.Types.ObjectId}],
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
},{
	timestamps: true
});

const schoolModel = mongoose.model('school', schoolSchema);

module.exports = schoolModel;
