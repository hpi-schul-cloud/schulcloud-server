/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { lessonSchema } = require('../src/services/lesson/model');
const { linkSchema } = require('../src/services/link/link-model');

// important lesson(s) and link(s) must write with s, because they are feather services that add the s
const LessonModel = mongoose.model('lesson613348381637', lessonSchema, 'lessons');
const LinkModelOld = mongoose.model('linkOld613348381637', linkSchema, 'linksBackup');
const LinkModelNew = mongoose.model('linkNew613348381637', linkSchema, 'links');

module.exports = {
	up: async function up() {
		await connect();
		alert(`Migrations replaceFileLinks is starting...`);
		// Use regex to get only matched fields
		// /files/fileModel/
		// [A-Za-z0-9]{10} ==> matched CUcACAnvKd
		// example https://hpi-schul-cloud.de/link/CUcACAnvKd

		const linkQuery = { target: { $regex: /files\/fileModel/g } };
		const amountProm = LinkModelOld.find(linkQuery).countDocuments();

		const $regex = /link\/[A-Za-z0-9]{10}/gm;
		const lessonsProm = LessonModel.find({ 'contents.content.text': { $regex } })
			.select({ 'contents.content': 1, _id: 1 })
			.lean()
			.exec();

		const [amount, lessons] = await Promise.all([amountProm, lessonsProm]);

		alert(`Found ${lessons.length} lessons with included file links.`);
		alert(`Found ${amount} total fileModel links.`);

		const limit = 500;
		let looped = 0;
		const deletedLinkTasks = [];

		while (looped < amount) {
			try {
				alert(`start loop ${looped} < ${amount}`);
				const links = await LinkModelOld.find(linkQuery)
					.sort({
						updatedAt: 1,
						createdAt: 1,
					})
					.skip(looped)
					.limit(limit)
					.select({ _id: 1, target: 1 })
					.lean()
					.exec();

				const matchedLinks = [];
				// match lessons
				// eslint-disable-next-line no-loop-func
				links.forEach((link) => {
					const matches = [];
					const linkId = link._id;

					lessons.forEach((lesson) => {
						lesson.contents.forEach((entry) => {
							if (entry.content && entry.content.text && entry.content.text.indexOf(linkId) !== -1) {
								entry.IS_MODIFIED = true;
								matches.push(entry);
							}
						});
					});

					if (matches.length > 0) {
						link.matches = matches;
						matchedLinks.push(link);
					}
				});

				alert(`Effected Links: ${matchedLinks.length}`);

				// all matched must replace with new entry
				// create new link > replace link in lessons > delete old link
				const createNewLinksPromise = [];
				matchedLinks.forEach((link) => {
					const prom = LinkModelNew.create({
						target: link.target,
						systemNote: { ticket: 'VOR-3', note: 'migration - new created', oldId: link._id },
					});
					createNewLinksPromise.push(prom);
				});

				alert(`Start creating new links...`);
				const newLinkDocs = await Promise.all(createNewLinksPromise);
				alert(`...finished!`);

				newLinkDocs.forEach((newLink) => {
					matchedLinks.forEach((oldLink) => {
						if (newLink.systemNote.oldId === oldLink._id) {
							oldLink.matches.forEach((entry) => {
								const regex = new RegExp(oldLink._id, 'g');
								entry.content.text = entry.content.text.replace(regex, newLink._id);
							});
						}
					});
				});

				deletedLinkTasks.push(matchedLinks.map(({ _id }) => _id.toString()));

				looped += links.length;
			} catch (err) {
				error(err);
			}
		}

		// executing lesson fixes
		const lessonModifiedPromise = [];

		lessons.forEach((lesson) => {
			lesson.contents.forEach((content, index) => {
				if (content.IS_MODIFIED === true) {
					const prom = LessonModel.updateOne(
						{ _id: lesson._id },
						{ $set: { [`contents.${index}.content.text`]: content.text } }
					)
						.lean()
						.exec();
					lessonModifiedPromise.push(prom);
				}
			});
		});

		let looped2 = 0;
		const chunkSize = 300;

		while (looped2 < lessonModifiedPromise.length) {
			const promiseChunk = lessonModifiedPromise.slice(looped2, looped2 + chunkSize);
			await Promise.all(promiseChunk);
			looped2 += chunkSize;
		}
		/*
		alert(`Start deleting old links...`);
		const deletedPromisses = [];
		deletedLinkTasks.forEach((deletedIds) => {
			const prom = LinkModelOld.deleteMany({ _id: { $in: deletedIds } })
				.lean()
				.exec();
			deletedPromisses.push(prom);
		});
		await Promise.all(deletedPromisses);
		alert(`...finished!`);
*/
		alert(`...migrations replaceFileLinks is finished!`);
		await close();
	},

	down: function down() {
		alert('Down is not supported.');
	},
};
