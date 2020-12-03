const { defaults } = require('lodash');
const { v4: uuidv4 } = require('uuid');

const { FileModel } = require('../../../../src/services/fileStorage/model');

let createdFiles = [];

const create = () => async (overrides) => {
	const data = defaults({}, overrides, {
		isDirectory: false,
		name: 'lorem-image.png',
		type: 'image/png',
		size: 12345,
		storageFileName: 'lorem-image.png',
		thumbnail: 'https://schulcloud.org/images/login-right.png',
		permissions: [
			{
				write: true,
				read: true,
				create: true,
				delete: true,
				refId: overrides.owner,
				refPermModel: overrides.refOwnerModel,
			},
		],
		creator: overrides.owner,
		thumbnailRequestToken: uuidv4(),
	});

	const file = await FileModel.create(data);
	createdFiles.push(file._id);
	return file;
};

const cleanup = () => {
	if (createdFiles.length === 0) {
		return Promise.resolve();
	}
	const ids = createdFiles;
	createdFiles = [];
	return FileModel.deleteMany({ id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: create(opt),
	cleanup,
	info: () => createdFiles,
});
