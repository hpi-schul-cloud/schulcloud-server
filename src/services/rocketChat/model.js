const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    pass: { type: String, required: true }
});

const model = mongoose.model('rocketChat', schema);

module.exports = model;
