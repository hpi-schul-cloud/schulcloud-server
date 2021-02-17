const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { homeworkSchema } = require('../src/services/homework/model');
const { linkSchema } = require('../src/services/link/link-model');

// important homework and link(s) must write with s, because they are feather services that add the s
const HomeworkModel = mongoose.model('homework613348381638', homeworkSchema, 'homeworks');
const LinkModelOld = mongoose.model('linkOld613348381638', linkSchema, 'linksBackup');
const LinkModelNew = mongoose.model('linkNew613348381638', linkSchema, 'links');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		alert(`Migrations replaceFileLinksHomework is starting...`);

		const linkQuery = { target: { $regex: /files\/fileModel/g } };
		const amountProm = LinkModelOld.find(linkQuery).countDocuments();

		const $regex = /link\/[A-Za-z0-9]{10}/gm;
		const homeworkProm = HomeworkModel.find({ description: { $regex } })
			.select({ description: 1, _id: 1 })
			.lean()
			.exec();

		const [amount, homework] = await Promise.all([amountProm, homeworkProm]);

		alert(`Found ${homework.length} homework with included file links.`);
		alert(`Found ${amount} total fileModel links.`);

		const limit = 500;
		let looped = 0;

		while (looped < amount) {
			try {
				alert(`start loop ${looped} < ${amount}`);
				// eslint-disable-next-line no-await-in-loop
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
				// match homework
				// eslint-disable-next-line no-loop-func
				links.forEach((link) => {
					const matches = [];
					const linkId = link._id;

					homework.forEach((hw) => {
						if (hw.description.includes(`link/${linkId}`)) {
							matches.push(hw);
						}
					});

					if (matches.length > 0) {
						link.matches = matches;
						matchedLinks.push(link);
					}
				});

				alert(`Effected Links: ${matchedLinks.length}`);

				// all matched must replace with new entry
				// create new link > replace link in homework > delete old link
				const createNewLinksPromise = matchedLinks.map((link) =>
					LinkModelNew.create({
						target: link.target,
						systemNote: { ticket: 'VOR-3', note: 'migration - new created', oldId: link._id },
					})
				);

				alert(`Start creating new links...`);
				// eslint-disable-next-line no-await-in-loop
				const newLinkDocs = await Promise.all(createNewLinksPromise);
				alert(`...finished!`);

				newLinkDocs.forEach((newLink) => {
					matchedLinks.forEach((oldLink) => {
						if (newLink.systemNote.oldId === oldLink._id) {
							oldLink.matches.forEach((hw) => {
								const regex = new RegExp(`link/${oldLink._id}`, 'g');
								hw.description = hw.description.replace(regex, `link/${newLink._id}`);
							});
						}
					});
				});

				looped += links.length;
			} catch (err) {
				error(err);
			}
		}

		// executing homework fixes
		const homeworkModifiedPromise = homework.map((hw) =>
			HomeworkModel.updateOne({ _id: hw._id }, { $set: { description: hw.description } })
				.lean()
				.exec()
		);

		const chunkSize = 300;

		for (let i = 0; i < homeworkModifiedPromise.length; i += chunkSize) {
			const promiseChunk = homeworkModifiedPromise.slice(i, i + chunkSize);
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(promiseChunk);
		}

		alert(`...migrations replaceFileLinksHomework is finished!`);

		await close();
	},

	down: async function down() {
		alert('Down is not supported.');
	},
};
