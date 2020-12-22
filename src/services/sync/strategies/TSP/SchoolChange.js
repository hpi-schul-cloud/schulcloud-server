const { getUsername } = require('./TSP');
const { FileModel } = require('../../../fileStorage/model.js');
const { info: logInfo, error: logError } = require('../../../../logger');

const getInvalidatedUuid = (uuid) => `${uuid}/invalid!`;
const getInvalidatedEmail = (email) => `${email}.invalid`;

const invalidateUser = async (app, user) => {
	const userService = app.service('usersModel');
	const accountService = app.service('accountModel');

	const invalidatedUuid = getInvalidatedUuid(user.sourceOptions.tspUid);
	const userChanges = {
		sourceOptions: {
			tspUid: invalidatedUuid,
		},
		email: getInvalidatedEmail(user.email),
	};
	await userService.patch(user._id, userChanges);

	const accountChanges = {
		username: getUsername(userChanges),
	};
	await accountService.patch(null, accountChanges, { query: { userId: user._id } });
};

const deleteUser = (app, user) => {
	const userService = app.service('usersModel');
	const accountService = app.service('accountModel');
	return Promise.all([
		userService.remove({ _id: user._id }),
		accountService.remove(null, { query: { userId: user._id } }),
	]);
};

const grantAccessToPrivateFiles = async (app, oldUser, newUser) => {
	const fileService = app.service('/files');
	const searchParams = {
		query: {
			'permissions.refPermModel': 'user',
			'permissions.refId': oldUser._id,
			refOwnerModel: 'user',
			owner: oldUser._id,
		},
	};
	const updateData = {
		owner: newUser._id,
		$set: { 'permissions.$.refId': newUser._id },
	};
	await fileService.patch(null, updateData, searchParams);
};

const grantAccessToSharedFiles = async (app, oldUser, newUser) => {
	try {
		logInfo('Looking for the files, in which refId in permissions array should be rewritten to the new user id');
		const filesToUpdate = await FileModel.updateMany(
			{
				'permissions.refPermModel': 'user',
				'permissions.refId': oldUser._id,
				owner: {
					$ne: oldUser._id,
				},
			},
			{
				$set: {
					'permissions.$.refId': newUser._id,
				},
			}
		);
		logInfo(`Amount of the files, in which refId has been changed: ${filesToUpdate.n}`);
	} catch (err) {
		logError(`Something went wrong during assigning new user id to refId in permissions array: ${err}`);
	}
};

const switchSchool = async (app, currentUser, createUserMethod) => {
	try {
		await invalidateUser(app, currentUser);
		const newUser = await createUserMethod();
		await Promise.all([
			grantAccessToPrivateFiles(app, currentUser, newUser),
			grantAccessToSharedFiles(app, currentUser, newUser),
		]);
		await deleteUser(app, currentUser);
		return newUser;
	} catch (err) {
		logError(`Something went wrong during switching school for user: ${err}`);
		return null;
	}
};

module.exports = {
	getInvalidatedUuid,
	invalidateUser,
	deleteUser,
	grantAccessToPrivateFiles,
	grantAccessToSharedFiles,
	switchSchool,
};
