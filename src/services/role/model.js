'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
	name: {type: String, required: true},
	permissions: {type: Object, required: true}
});

const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
