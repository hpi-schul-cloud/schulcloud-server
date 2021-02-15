/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { lessonSchema } = require('../src/services/lesson/model');
const { linkSchema } = require('../src/services/link/link-model');

// important lesson(s) and link(s) must write with s, because they are feather services that add the s
const LessonModel = mongoose.model('lesson613348381637', lessonSchema, 'lessons');
const LinkModel = mongoose.model('link613348381637', linkSchema, 'links');

/*
const handleMatches = (counter, matches) => (linkId, lessonId, content) => {
	if (content.text && content.text.indexOf(linkId) !== -1) {
		matches.push({
			linkId,
			lessonId: lesson._id,
			content,
		});
		effectedContentEntrys += 1;
	}
}
*/
module.exports = {
	up: async function up() {
		await connect();
		// Can materialIds effected?
		// Use regex to get only matched fields
		// /files/fileModel/
		// [A-Za-z0-9]{10} ==> matched CUcACAnvKd
		// example https://hpi-schul-cloud.de/link/CUcACAnvKd

		const $regex = /link\/[A-Za-z0-9]{10}/gm;
		const lessons = await LessonModel.find({ 'contents.content.text': { $regex } })
			.select({ 'contents.content': 1, _id: 1 })
			.lean()
			.exec();

		alert(`Found ${lessons.length} lessons with included file links.`);

		const linkQuery = { target: { $regex: /files\/fileModel/g } };
		const amount = await LinkModel.find(linkQuery).countDocuments();

		alert(`Found ${amount} total fileModel links.`);

		const limit = 500;
		let looped = 0;

		while (looped < amount) {
			try {
				alert(`start loop ${looped} < ${amount}`);
				const links = await LinkModel.find(linkQuery)
					.sort({
						updatedAt: 1,
						createdAt: 1,
					})
					.skip(looped)
					.limit(limit)
					.select({ _id: 1, target: 1 })
					.lean()
					.exec();

				const machtedLinks = [];
				// match lessons
				// eslint-disable-next-line no-loop-func
				links.forEach((link) => {
					const matches = [];
					const linkId = link._id;

					lessons.forEach((lesson) => {
						lesson.content.forEach((content, index) => {
							if (content.text && content.text.indexOf(linkId) !== -1) {
								matches.push({
									// linkId,
									lessonId: lesson._id,
									index,
									content,
								});
							}
						});
					});

					if (matches.length > 0) {
						link.matches = matches;
						machtedLinks.push(link);
					}
				});

				alert(`Effected Links: ${machtedLinks.length}`);

				// all matched must replace with new entry
				// create new > replace lessons > delete old
				const createNewLinksPromise = [];
				machtedLinks.forEach((link) => {
					// test if promise
					const prom = LinkModel.create({
						target: link.target,
						systemNote: { ticket: 'VOR-3', note: 'migration - new created', oldId: link._id },
					});
					createNewLinksPromise.push(prom);
				});

				alert(`Start creating new links...`);
				const newLinks = await Promise.all(createNewLinksPromise);
				alert(`...finished!`);

				const replaceLessonContentPromises = [];

				newLinks.forEach((newLink) => {
					machtedLinks.forEach((oldLink) => {
						if (newLink.systemNote.oldId.toString() === oldLink._id.toString()) {
							oldLink.matches.forEach(({ lessonId, content, index }) => {
								const regex = new RegExp(oldLink._id.toString(), 'g');
								const newContent = content.replace(regex, newLink._id.toString());
								const prom = LessonModel.updateOne({ _id: lessonId }, { $set: { [`contents.${index}`]: newContent } })
									.lean()
									.exec();
								replaceLessonContentPromises.push(prom);
							});
						}
					});
				});

				alert(`Effected content entrys: ${replaceLessonContentPromises.length}`);

				alert(`Start replacing links in content...`);
				await Promise.all(replaceLessonContentPromises);
				alert(`...finished!`);

				const deletedIds = machtedLinks.map(({ _id }) => _id.toString());

				alert(`Start deleting old links...`);
				await LinkModel.deleteMany({ _id: { $in: deletedIds } });
				alert(`...finished!`);

				looped += links.length;
			} catch (err) {
				error(err);
			}
		}
		// lessons.contents.content.text
		// .url also exist ?
		// .ressources ?
		await close();
	},

	down: function down() {
		alert('Down is not supported.');
	},
};
