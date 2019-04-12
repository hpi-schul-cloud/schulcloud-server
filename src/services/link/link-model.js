'use strict';

// release-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');

const Schema = mongoose.Schema;
const linkLength = 5;

const linkSchema = new Schema({
	_id: {
		type: ShortId,
		len: linkLength,
		alphabet: 'abcdefghkmnopqrstuvwxyzABCDEFGHKLMNPQRSTUVWXYZ123456789', // Base 62 (a-Z, 0-9) without similiar looking chars
		retries: 20  // number of retries on collision
	},
	data: { type: Object },
	target: {type: String, required: true},
	createdAt: {type: Date, 'default': Date.now}
});

const linkModel = mongoose.model('link', linkSchema);
linkModel.linkLength = linkLength;
module.exports = linkModel;
