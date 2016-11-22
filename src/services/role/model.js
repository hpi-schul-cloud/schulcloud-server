'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
	name: {type: String, required: true},
	permissions: [{type: String}]
});

const roleModel = mongoose.model('role', roleSchema);

module.exports = roleModel;
