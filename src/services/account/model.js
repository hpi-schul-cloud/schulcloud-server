'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},

    userId: {type: Schema.Types.ObjectId, required: true},

    token: {type: String, required: true},
    reference: {type: String /*, required: true*/},

    school: {type: Schema.Types.ObjectId /*, required: true*/},
    system: {type: Schema.Types.ObjectId /*, required: true*/},

    expiresAt: {type: Date}
});

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;
