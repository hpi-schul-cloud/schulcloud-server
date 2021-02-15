// release-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const { enableAuditLog } = require('../../utils/database');

const { Schema } = mongoose;
const LINK_LENGTH = 10;

const linkSchema = new Schema({
	_id: {
		type: ShortId,
		len: LINK_LENGTH,
		// Base 62 (a-Z, 0-9) without similiar looking chars
		alphabet: 'abcdefghkmnopqrstuvwxyzABCDEFGHKLMNPQRSTUVWXYZ123456789',
		retries: 20, // number of retries on collision
	},
	data: { type: Object },
	target: { type: String, required: true, index: true },
	createdAt: { type: Date, default: Date.now },
});

enableAuditLog(linkSchema);

const LinkModel = mongoose.model('link', linkSchema);
LinkModel.linkLength = LINK_LENGTH; // fixme`

module.exports = { LinkModel, linkSchema };
