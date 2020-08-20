const { getUsername } = require('./TSP');
const { FileModel } = require('../../../fileStorage/model.js');

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
		const filesToUpdate = await FileModel.updateMany(
			{
				'permissions.refPermModel': 'user',
				'permissions.refId': oldUser._id,
				owner: {
					$ne: oldUser._id,
				}
			},
			{ $set: { 'permissions.$.refId': newUser._id } });
		return filesToUpdate;
	} catch (err) {
		console.log(err);
	}

	/*
		- shared files are those with
			a) one item in the permissions array with (refPermModel === 'user' && refId === oldUser._id) AND
			b) creator must not be oldUser._id (the creator of a file used to be denoted by the first item in the
				permisions array; that is no longer the case -- we have the creator attribute now -- but files
				still have both => SC-3851)
	*/
};

const switchSchool = async (app, currentUser, createUserMethod) => {
	await invalidateUser(app, currentUser);
	const newUser = await createUserMethod();
	await Promise.all([
		grantAccessToPrivateFiles(app, currentUser, newUser),
		grantAccessToSharedFiles(app, currentUser, newUser),
	]);
	await deleteUser(app, currentUser);
	return newUser;
};

module.exports = {
	getInvalidatedUuid,
	invalidateUser,
	deleteUser,
	grantAccessToPrivateFiles,
	grantAccessToSharedFiles,
	switchSchool,
};
