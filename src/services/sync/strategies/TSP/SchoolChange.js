const { getUsername } = require('./TSP');

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
		accountService.remove({ userId: user._id }),
	]);
};

const grantAccessToPrivateFiles = async (app, oldUser, newUser) => {
	/*
		- private files are those with (refOwnerModel === 'user' && owner === oldUser._id)
		- Let's discuss if we should copy them (the metadata) or just override all fields that
		contain oldUser._id with newUser._id...
	*/
};

const grantAccessToSharedFiles = async (app, oldUser, newUser) => {
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
