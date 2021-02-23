const fs = require('fs').promises;

const { bgWhite } = require('chalk');
const { ObjectId } = require('mongoose').Types;
const { randomBytes } = require('crypto');
const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../src/logger');
const etherpadClient = require('../src/services/etherpad/utils/EtherpadClient.js');
const { connect, close } = require('../src/utils/database');
const { LessonModel: Lesson } = require('../src/services/lesson/model');

/** *****************************************
 * MESSAGES
 ****************************************** */
const msgRevertedSuccess = 'There were errors reverting pads from some lessons.\nCheck {0}';
const msgRevertedError = 'nLessons are successfully reverted.\nFor additional info Check {0}';
const msgSuccessReverted = 'Successfully reverted Etherpad lesson {0} content {1} from {2} to {3}';
const msgEmpty = 'No Pads found to migrate.';
const msgSuccessSave = 'Successful saved lesson {0}';
const msgSuccessRevert = 'Successful reverted lesson {0}';
const msgSuccessMigrated = 'Successfully migrated Etherpad lesson {0} content {1} from /p/{2} to {3}';
const msgMigrateErrors = 'There were errors migrating pads from some lessons.\nCheck {0}';
const msgMigrateSuccess = 'nLessons are successfully migrated.\nFor additional info Check {0}';
const msgContentError = 'some pads could not be migrated';
const msgLessonError = 'Error saving lesson {0} {1}';
const msgRevertError = 'Error reverting lesson {0} {1}';

/** *****************************************
 * HELPER
 ****************************************** */
const date = new Date().toISOString();
const LOGDIR = `${__dirname}/etherpad_migration_${date}.log`;
let HAVE_ERRORS = false;

async function gotErrors() {
	HAVE_ERRORS = true;
}

async function log(...theArgs) {
	for (let step = 0; step < Object.keys(theArgs).length; step += 1) {
		const messageDate = new Date().toISOString();
		await fs.appendFile(LOGDIR, `[${messageDate}]: ${theArgs[step]}\n`);
	}
}

const getPadIdFromUrl = (path) => {
	let myPath = path.toString();
	const parsedUrl = new URL(myPath);
	myPath = parsedUrl.pathname;
	return myPath.substring(myPath.lastIndexOf('/') + 1);
};

if (!String.format) {
	// eslint-disable-next-line arrow-body-style
	String.format = (format, args) => {
		// eslint-disable-next-line no-undef
		return format.replace(/{(\d+)}/g, (match, number) => {
			if (typeof args[number] !== 'undefined') {
				return args[number];
			}
			return match;
		});
	};
}

/** *****************************************
 * Progress Bar
 ****************************************** */
class ProgressBar {
	constructor() {
		this.title = 'Progress';
		this.total = 0;
		this.current = 0;
		this.barLength = 80 - 30; // process.stdout.columns
	}

	init(total, title = 'Migrating Etherpads') {
		this.total = total;
		this.title = title;
		this.current = 0;
		this.update(this.current);
	}

	update(current = 1) {
		this.current += current;
		const currentProgress = this.current / this.total;
		this.draw(currentProgress);
	}

	draw(currentProgress) {
		const filledBarLength = (currentProgress * this.barLength).toFixed(0);
		const emptyBarLength = this.barLength - filledBarLength;

		const filledBar = this.getBar(filledBarLength, ' ', bgWhite);
		const emptyBar = this.getBar(emptyBarLength, '-');
		// const progressSum = ((currentProgress * 100).toFixed(2)) + "%";
		const progressSum = `${this.current}/${this.total}`;

		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(String.format('{0}: [{1}{2}] | {3}', [this.title, filledBar, emptyBar, progressSum]));
	}

	getBar(length, char, color = (a) => a) {
		let str = '';
		for (let i = 0; i < length; i += 1) {
			str += char;
		}
		return color(str);
	}
}

function chunkArray(myArray, chunkSize) {
	let index = 0;
	const arrayLength = myArray.length;
	const tempArray = [];

	for (index = 0; index < arrayLength; index += chunkSize) {
		const myChunk = myArray.slice(index, index + chunkSize);
		// Do something if you want with the group
		tempArray.push(myChunk);
	}

	return tempArray;
}

/** *****************************************
 * MAIN
 ****************************************** */
const run = async (oldPadDomain) => {
	const searchRegex = new RegExp(`https://${oldPadDomain.replace(/\./g, '\\.')}.*`);

	const lessonResult = await Lesson.find({
		contents: { $elemMatch: { component: 'Etherpad', 'content.url': searchRegex } },
	});

	if (lessonResult.length <= 0) {
		return Promise.resolve(msgEmpty);
	}

	const CurrentProgress = new ProgressBar();
	CurrentProgress.init(lessonResult.length);
	CurrentProgress.update(0);

	const lessons = chunkArray(lessonResult, 1);

	for (let index = 0; index < lessons.length; index += 1) {
		const foundLessons = lessons[index];
		await Promise.allSettled(
			foundLessons.map(async (lesson) => {
				const { courseId } = lesson;
				const groupResult = await etherpadClient.createOrGetGroup({
					groupMapper: `${courseId}`,
				});
				const { groupID } = groupResult.data;
				let overallResult = {
					message: String.format(msgSuccessSave, [lesson._id]),
					state: 'resolved',
				};
				await Promise.allSettled(
					lesson.contents.map(async (content) => {
						if (content.component === 'Etherpad') {
							const oldPadId = getPadIdFromUrl(content.content.url);
							if (typeof content.content.title === 'undefined' || content.content.title === '') {
								content.content.title = randomBytes(12).toString('hex');
							}
							const padName = content.content.title;
							const createResult = await etherpadClient.createOrGetGroupPad({
								groupID,
								oldPadId,
								padName,
							});
							const newPadId = createResult.data.padID;
							content.content.oldPadUrl = content.content.url;
							content.content.url = `${Configuration.get('ETHERPAD_NEW_PAD_URI')}/${newPadId}`;
							await log(String.format(msgSuccessMigrated, [lesson._id, content._id, oldPadId, newPadId]));
							return Promise.resolve(1);
						}
						return Promise.resolve(1);
					})
				).then(async (results) => {
					await Promise.allSettled(
						results.map(async (result, i) => {
							if (result.status === 'rejected') {
								const contentId = lesson.contents[i]._id;
								const error = `lesson ${lesson._id} content ${contentId}: ${result.reason}`;
								overallResult = {
									message: msgContentError,
									state: 'rejected',
								};
								await log(error);
								return Promise.reject(error);
							}
							return Promise.resolve(1);
						})
					);
				});

				// Saving updated lesson
				await Lesson.updateOne({ _id: ObjectId(lesson._id) }, lesson);

				if (overallResult.state === 'rejected') {
					return Promise.reject(overallResult.message);
				}
				return Promise.resolve(overallResult.message);
			})
		).then(async (results) => {
			// eslint-disable-next-line no-loop-func
			await Promise.allSettled(
				results.map(async (result, i) => {
					if (result.status === 'rejected') {
						await gotErrors();
						const error = String.format(msgLessonError, [foundLessons[i]._id, result.reason]);
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

	// REPORTING
	if (HAVE_ERRORS) {
		// eslint-disable-next-line prefer-template
		logger.error('\n\n' + String.format(msgMigrateErrors, [LOGDIR]));
	} else {
		// eslint-disable-next-line prefer-template
		logger.info('\n\n' + String.format(msgMigrateSuccess, [LOGDIR]));
	}

	// beautify progress bar.
	process.stdout.write('\n');

	return Promise.resolve(1);
};

const revert = async () => {
	const lessonResult = await Lesson.find({
		contents: { $elemMatch: { component: 'Etherpad', 'content.oldPadUrl': /.+/ } },
	});

	if (lessonResult.length <= 0) {
		return Promise.resolve(msgEmpty);
	}

	const CurrentProgress = new ProgressBar();
	CurrentProgress.init(lessonResult.length, 'Reverting Etherpad Migrations');
	CurrentProgress.update(0);
	await Promise.allSettled(
		lessonResult.map(async (lesson) => {
			let LessonResult = {
				message: String.format(msgSuccessRevert, [lesson._id]),
				state: 'resolved',
			};
			await Promise.allSettled(
				lesson.contents.map(async (content) => {
					if (content.component === 'Etherpad') {
						await log(
							String.format(msgSuccessReverted, [
								lesson._id,
								content._id,
								content.content.oldPadUrl,
								content.content.url,
							])
						);
						content.content.url = content.content.oldPadUrl;
					}
					return Promise.resolve(1);
				})
			).then(async (results) => {
				await Promise.allSettled(
					results.map(async (result, i) => {
						if (result.status === 'rejected') {
							const contentId = lesson.contents[i]._id;
							const msgRevertLessonError = 'lesson {0} content {1}: {2}';
							const error = String.format(msgRevertLessonError, [lesson._id, contentId, result.reason]);
							LessonResult = {
								message: msgContentError,
								state: 'rejected',
							};
							await log(error);
							return Promise.reject(new Error(error));
						}
						return Promise.resolve(1);
					})
				);
			});
			await Lesson.updateOne({ _id: ObjectId(lesson._id) }, lesson).catch((err) => {
				logger.error(err);
			});
			if (LessonResult.state === 'rejected') {
				return Promise.reject(LessonResult.message);
			}
			return Promise.resolve(LessonResult.message);
		})
	).then(async (results) => {
		await Promise.allSettled(
			results.map(async (result, i) => {
				if (result.status === 'rejected') {
					await gotErrors();
					const error = String.format(msgRevertError, [lessonResult[i]._id, result.reason]);
					await log(error);
					return Promise.reject(error);
				}
				CurrentProgress.update();
				await log(result.value);
				return Promise.resolve(1);
			})
		);
	});

	// REPORTING
	if (HAVE_ERRORS) {
		// eslint-disable-next-line prefer-template
		logger.info('\n\n' + String.format(msgRevertedError, [LOGDIR]));
	} else {
		// eslint-disable-next-line prefer-template
		logger.info('\n\n' + String.format(msgRevertedSuccess, [LOGDIR]));
	}

	// beautify progress bar.
	process.stdout.write('\n');

	return Promise.resolve(1);
};

module.exports = {
	up: async function up() {
		if (!Configuration.has('ETHERPAD_OLD_PAD_DOMAIN')) {
			return;
		}
		await connect();
		await run(Configuration.get('ETHERPAD_OLD_PAD_DOMAIN')).catch(async (err) => {
			logger.error(err);
		});
		await close();
	},

	down: async function down() {
		await connect();
		await revert().catch(async (err) => {
			logger.error(err);
		});
		await close();
	},
};
