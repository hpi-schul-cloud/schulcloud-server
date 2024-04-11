#!/usr/bin/env node
const arg = require('arg');

const appPromise = require('../src/app');
const { Configuration } = require('@hpi-schul-cloud/commons');
const etherpadClient = require('../src/services/etherpad/utils/EtherpadClient.js');
const { randomBytes } = require('crypto');
const { ObjectId } = require('mongodb');
const fs = require('fs').promises;

const date = new Date().toISOString();
const LOGDIR = __dirname + `/etherpad_migration_${date}.log`;
const ONE_RUN_LIMIT = 100_000;

async function log(...theArgs) {
	for (let step = 0; step < Object.keys(theArgs).length; step++) {
		const date = new Date().toISOString();
		await fs.appendFile(LOGDIR, `[${date}]` + ': ' + theArgs[step] + '\n');
	}
}

/** *****************************************
 * ARGUMENT PARSING
 ****************************************** */

const args = arg(
	{
		// Types
		'--help': Boolean, // show the help
		'-h': '--help',
	},
	{
		permissive: true,
		argv: process.argv.slice(2),
	}
);

const HELP = `Usage: node migrate-etherpads.js <oldPadDomain>

This script searches for etherpad pads in all lessons with an old pad url.
It then takes those old pads and uses the etherpad api's "copyPad" function
to copy the contents of the old pad to a new grouppad for given course.
Finally it saves the changes to the given lesson.

Example:
node ./migrate-etherpads.js etherpad.dbildungscloud.de
npm run migrate-etherpads -- etherpad.dbildungscloud.de

OPTIONS:
--help (-h)        Show this help.
`;

if (args['--help']) {
	console.log(HELP);
	process.exit(0);
}

/** *****************************************
 * HELPER
 ****************************************** */
const getPadIdFromUrl = (path) => {
	path += '';
	const parsedUrl = new URL(path);
	path = parsedUrl.pathname;
	return path.substring(path.lastIndexOf('/') + 1);
};

/** *****************************************
 * Progress Bar
 ****************************************** */
const { bgWhite } = require('chalk');

class ProgressBar {
	constructor() {
		this.total;
		this.current = 0;
		this.bar_length = 80 - 30; // process.stdout.columns
	}

	init(total) {
		this.total = total;
		this.current = 0;
		this.update(this.current);
	}

	update(current = 1) {
		this.current += current;
		const current_progress = this.current / this.total;
		this.draw(current_progress);
	}

	draw(current_progress) {
		const filled_bar_length = (current_progress * this.bar_length).toFixed(0);
		const empty_bar_length = this.bar_length - filled_bar_length;

		const filled_bar = this.get_bar(filled_bar_length, ' ', bgWhite);
		const empty_bar = this.get_bar(empty_bar_length, '-');
		//const progressSum = ((current_progress * 100).toFixed(2)) + "%";
		const progressSum = this.current + '/' + this.total;

		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`Migrating Etherpads: [${filled_bar}${empty_bar}] | ${progressSum}`);
	}

	get_bar(length, char, color = (a) => a) {
		let str = '';
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return color(str);
	}
}

function chunkArray(myArray, chunk_size) {
	var index = 0;
	var arrayLength = myArray.length;
	var tempArray = [];

	for (index = 0; index < arrayLength; index += chunk_size) {
		myChunk = myArray.slice(index, index + chunk_size);
		// Do something if you want with the group
		tempArray.push(myChunk);
	}

	return tempArray;
}

/** *****************************************
 * MAIN
 ****************************************** */
const run = async (oldPadDomain) => {
	const app = await appPromise();
	let searchRegex = new RegExp(`https://${oldPadDomain.replace(/\./g, '\\.')}.*`);

	const lessonsService = app.service('/lessons');
	const lessonResult = await lessonsService.Model.find({
		contents: { $elemMatch: { component: 'Etherpad', 'content.url': searchRegex } },
	}).limit(ONE_RUN_LIMIT);

	if (lessonResult.length <= 0) {
		return Promise.reject('No Pads found to migrate.');
	}

	const CurrentProgress = new ProgressBar();
	CurrentProgress.total = lessonResult.length;
	CurrentProgress.update(0);

	const lessons = chunkArray(lessonResult, 1);

	let errors = false;
	for (let index = 0; index < lessons.length; index++) {
		const foundLessons = lessons[index];
		await Promise.allSettled(
			foundLessons.map(async (lesson) => {
				let courseId = lesson.courseId;
				let groupResult = await etherpadClient.createOrGetGroup({
					groupMapper: '' + courseId,
				});
				let groupID = groupResult.data.groupID;
				let overallResult = {
					message: `Successful saving lesson ${lesson._id}`,
					state: 'resolved',
				};
				await Promise.allSettled(
					lesson.contents.map(async (content) => {
						if (content.component === 'Etherpad') {
							let oldPadId = getPadIdFromUrl(content.content.url);
							if (typeof content.content.title === 'undefined' || content.content.title === '') {
								content.content.title = randomBytes(12).toString('hex');
							}
							let padName = content.content.title;
							let createResult = await etherpadClient.createOrGetGroupPad({
								groupID,
								oldPadId,
								padName,
							});
							let newPadId = createResult.data.padID;
							content.content.url = Configuration.get('ETHERPAD__PAD_URI') + `/${newPadId}`;
							await log(
								`Successfully migrated Etherpad lesson ${lesson._id} content ${content._id} from /p/${oldPadId} to ${newPadId}`
							);
							return Promise.resolve(1);
						}
					})
				).then(async (results) => {
					await Promise.allSettled(
						results.map(async (result, index) => {
							if (result.status === 'rejected') {
								let contentId = lesson.contents[index]._id;
								const error = `lesson ${lesson._id} content ${contentId}: ${result.reason}`;
								overallResult = {
									message: 'some pads could not be migrated',
									state: 'rejected',
								};
								await log(error);
								return Promise.reject(error);
							}
							return Promise.resolve(1);
						})
					);
				});
				let result = await lessonsService.Model.updateOne({ _id: ObjectId(lesson._id) }, lesson);
				if (overallResult.state === 'rejected') {
					return Promise.reject(overallResult.message);
				}
				return Promise.resolve(overallResult.message);
			})
		).then(async (results) => {
			await Promise.allSettled(
				results.map(async (result, index) => {
					if (result.status === 'rejected') {
						errors = true;
						let lessonId = foundLessons[index]._id;
						const error = `Error saving lesson ${lessonId} ${result.reason}`;
						await log(error);
						return Promise.reject(error);
					}
					CurrentProgress.update();
					await log(result.value);
					return Promise.resolve(1);
				})
			);
		});
	}
	if (errors) {
		console.log(`\n\nThere were errors migrating pads from some lessons.\nCheck ${LOGDIR}`);
	} else {
		console.log(`\n\nLessons are successfully migrated.\nFor additional info Check ${LOGDIR}`);
	}
	process.stdout.write('\n');
	return Promise.resolve(1);
};

const main = () => {
	if (args._.length === 0 || args._.length > 1) {
		console.log(HELP);
		process.exit(0);
	}
	return new Promise(async (resolve) => {
		await run(args._[0]).catch(async (err) => {
			console.log(err);
		});
		process.exit(0);
	});
};

main();
