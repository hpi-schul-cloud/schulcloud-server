'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	roles: [{type: Schema.Types.ObjectId}],
	accounts: [{type: Schema.Types.ObjectId}],

	firstName: {type: String},
	lastName: {type: String},
	userName: {type: String},

	birthday: {type: Date}
});

userSchema.methods.getPermissions = function() {
	const roleModel = require('../role/model');
	return roleModel.resolvePermissions(this.roles);
};

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
