/* eslint-disable no-console */
const ran = true; // set to true to exclude migration
const name = 'Remove all hard coded sc editor links from lessons.';

const mongoose = require('mongoose');

const model = require('../src/services/lesson/model.js');

mongoose.Promise = global.Promise;

const run = async () => {
	mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/schulcloud', { user: process.env.DB_USERNAME, pass: process.env.DB_PASSWORD });

	const errorHandler = (err) => {
		console.log('Error', err);
		return undefined;
	};

	// take lessons
	console.log('start: take all lessons');
	const lessons = await model.find({
		contents: {
			$not: { $size: 0 },
		},
	}, { contents: 1, _id: 1 }).exec().catch(errorHandler);
	console.log('end: take all lessons');
	console.log(lessons);
	// filter errors
	const notValid = ['localhost']; // todo use regex
	let broken = [];

	lessons.forEach((lesson) => {
		lesson.contents.forEach((content) => {
			const { text } = content;
			for (let i = 0; i < notValid.length; i++) {
				if (text.includes(notValid[i])) {
					broken.push({ lesson, i, text });
					return;
				}
			}
		});
	});
	// execute fix's as single task
	let fixes = [];

	return Promise.all(fixes);
};

run();


module.exports = {
	ran,
	name,
	run,
};
