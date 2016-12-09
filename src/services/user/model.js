'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	roles: [{type: Schema.Types.ObjectId, ref: 'role'}],
	accounts: [{type: Schema.Types.ObjectId, ref: 'account'}],

	schoolId: {type: Schema.Types.ObjectId, ref: 'school'},

	firstName: {type: String},
	lastName: {type: String},
	userName: {type: String},

	birthday: {type: Date}
},{
	timestamps: true
});

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
