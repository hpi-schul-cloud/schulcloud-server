'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statisticsSchema = new Schema({
	users: {type: Number, required: true},
	schools: {type: Number, required: true},
	accounts: {type: Number, required: true},
	homework: {type: Number, required: true},
	submissions: {type: Number, required: true},
	comments: {type: Number, required: true},
	lessons: {type: Number, required: true},
	classes: {type: Number, required: true},
	courses: {type: Number, required: true},
	files: {type: Number, required: true},
	directories: {type: Number, required: true},
	teachers: {type: Number, required: true},
	students: {type: Number, required: true},
},{
	timestamps: true
});

const statisticsModel = mongoose.model('statistic', statisticsSchema);
module.exports = statisticsModel;
