const request = require('./request');
const fakeParams = require('./fakeParams');
const setForceKey = require('./setForceKey');
const { getCourse, getLessonsByCourse } = require('./course');

module.exports = {
	request,
	fakeParams,
	setForceKey,
	getCourse,
	getLessonsByCourse,
};
