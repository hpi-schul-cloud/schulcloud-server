'use strict';

// federalState-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const federalStateSchema = new Schema({
	name: {type: String, required: true},
	abbreviation: {type: String, required: true},
	logoUrl: {type: String, required: true},
	createdAt: {type: Date, 'default': Date.now},
	updatedAt: {type: Date, 'default': Date.now}
});

const federalStateModel = mongoose.model('federalstate', federalStateSchema);

module.exports = federalStateModel;
