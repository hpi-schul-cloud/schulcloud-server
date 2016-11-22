'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const role = require('./roles');



const userSchema = new Schema({
	roles: [{key: String, permission: Number}],
	accounts: [{type: Schema.Types.ObjectId}],

	firstName: {type: String},
	lastName: {type: String},
	userName: {type: String},

	birthday: {type: Date}
});


userSchema.methods.hasPermission = (cb) => {
	console.log(this, 'avb');
};


const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
