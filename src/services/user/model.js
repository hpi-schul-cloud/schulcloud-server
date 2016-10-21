'use strict';

// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

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

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
