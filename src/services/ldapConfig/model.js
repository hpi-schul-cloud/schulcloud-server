'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ldapConfigSchema = new Schema({
	name: { type: String, required: true },
	url: { type: String, required: true },
	rootPath: { type: String, required: true },
	createdAt: { type: Date, 'default': Date.now },
	updatedAt: { type: Date, 'default': Date.now }
}, {
	timestamps: true
});

const ldapConfigModel = mongoose.model('ldapConfig', ldapConfigSchema);

module.exports = {
	ldapConfigModel
};
