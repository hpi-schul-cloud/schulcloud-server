const request = require('./request');
const customParams = require('././customParams');
const setForceKey = require('./setForceKey');
const { getCourse, getLessonsByCourse } = require('./course');
const models = require('./models');

module.exports = {
	request,
	customParams,
	setForceKey,
	getCourse,
	getLessonsByCourse,
	models,
};
