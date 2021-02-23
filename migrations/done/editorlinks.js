/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
/* eslint no-param-reassign: 1  */
const ran = true; // set to true to exclude migration
const name = 'Replace all hard coded links to old file ids in lesson.';
const mongoose = require('mongoose');

const { Schema } = mongoose;
const database = require('../../src/utils/database');
const { LessonModel } = require('../../src/services/lesson/model.js');
const { FileModel } = require('../../src/services/fileStorage/model.js');

mongoose.Promise = global.Promise;

const sanitizeObj = (obj) => {
	Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
	return obj;
};

const convertDocument = (doc) => {
	const [refOwnerModel, owner] = doc.key.split('/');

	const refOwnerModelMap = {
		users: 'user',
		courses: 'course',
	};

	// Props obsolete in new model
	const nullers = {
		_id: undefined,
		__v: undefined,
		key: undefined,
		path: undefined,
		schoolId: undefined,
		flatFileName: undefined,
		studentCanEdit: undefined,
		permissions: undefined,
	};

	return sanitizeObj({
		...doc,
		isDirectory: !doc.type,
		refOwnerModel: refOwnerModelMap[refOwnerModel] || refOwnerModel,
		owner,
		storageFileName: doc.flatFileName,
		...nullers,
	});
};

const permissionTypes = ['can-read', 'can-write'];

const oldFileSchema = new Schema({
	key: { type: String, required: true, unique: true },
	path: { type: String },
	name: { type: String },
	size: { type: Number },
	type: { type: String },
	flatFileName: { type: String },
	thumbnail: { type: String },
	permissions: [
		{
			userId: { type: Schema.Types.ObjectId, ref: 'user' },
			permissions: [{ type: String, enum: permissionTypes }],
		},
	],
	lockId: { type: Schema.Types.ObjectId },
	shareToken: { type: String },
	schoolId: { type: Schema.Types.ObjectId, ref: 'school' },
	studentCanEdit: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

const run = async () => {
	database.connect();
	const oldfileModel = mongoose.model('oldfile', oldFileSchema, '_files');

	const errorHandler = (err) => {
		console.log('Error', err);
		return undefined;
	};

	// take lessons
	let lessons = await LessonModel.find(
		{
			contents: {
				$not: { $size: 0 },
			},
		},
		{ contents: 1, _id: 1 }
	)
		.exec()
		.catch(errorHandler);

	lessons = lessons.filter((lesson) => lesson.contents.some((c) => c.component === 'text'));

	const promises = lessons.map((lesson) => {
		const regex = /(?:src|href)=\"(.*?\/files\/file\?(?:path|file)=(.+?\/[0-9a-z]+?\/.*?))\"/gm;
		const { contents } = lesson;

		const lessonPromises = contents.map((content) => {
			if (content.component !== 'text' || !regex.test(content.content.text)) {
				return Promise.resolve(false);
			}
			console.log(`Touching lesson with ID ${lesson._id}`);

			const oldKeys = content.content.text.match(regex).map((str) => str.replace(regex, '$2'));

			console.log(`Found old path keys ${oldKeys}`);

			const oldPromises = oldKeys
				.map((key) => {
					const fn = key.split('/').pop();
					return key.replace(fn, encodeURIComponent(fn));
				})
				.map((key) => oldfileModel.findOne({ key }).lean().exec().catch(errorHandler));

			return Promise.all(oldPromises)
				.then((oldFiles) => {
					const newFiles = oldFiles
						.filter((file) => file)
						.map((file) => convertDocument(file))
						.map((file) => FileModel.findOne(file).exec().catch(errorHandler));

					return Promise.all(newFiles);
				})
				.then((files) => {
					const update = contents.map((c) => {
						if (c.component === 'text' && regex.test(c.content.text)) {
							const { text } = c.content;
							c.content.text = text.replace(regex, (...[match, attribute, key]) => {
								const oldKey = oldKeys.indexOf(key);
								if (files[oldKey]) {
									return match.replace(attribute, `/files/file?file=${files[oldKey]._id}`);
								}
								return match;
							});
						}
						return c;
					});
					return LessonModel.update({ _id: lesson._id }, { contents: update }).exec().catch(errorHandler);
				});
		});

		return Promise.all(lessonPromises);
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
