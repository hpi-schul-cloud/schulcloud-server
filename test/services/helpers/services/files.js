const { v4: uuidv4 } = require('uuid');

const { FileModel } = require('../../../../src/services/fileStorage/model');

let createdFiles = [];

const defaultPermission = {
	write: true,
	read: true,
	create: true,
	delete: true,
	refId: null,
	refPermModel: 'user',
};

const createPermission = (input) => ({ ...defaultPermission, ...input });

const create = async ({
	owner,
	creator,
	refOwnerModel = 'user',
	refId,
	additonalPermissions,
	isDirectory = false,
	deletedAt = undefined,
} = {}) => {
	const data = {
		isDirectory,
		name: 'lorem-image.png',
		type: 'image/png',
		size: 12345,
		storageFileName: 'lorem-image.png',
		thumbnail: 'https://schulcloud.org/images/login-right.png',
		permissions: [
			createPermission({
				refId: refId || owner,
				refPermModel: refOwnerModel,
			}),
		],
		owner,
		creator: creator || owner,
		refOwnerModel,
		thumbnailRequestToken: uuidv4(),
		deletedAt,
	};
	if (additonalPermissions) {
		data.permissions = [...data.permissions, ...additonalPermissions];
	}

	const file = await FileModel.create(data);
	createdFiles.push(file._id);
	return file.toObject();
};

const cleanup = () => {
	if (createdFiles.length === 0) {
		return Promise.resolve();
	}
	const ids = createdFiles;
	createdFiles = [];
	return FileModel.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = () => ({
	create,
	cleanup,
	info: () => createdFiles,
	createPermission,
});
