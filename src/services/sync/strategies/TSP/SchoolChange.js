const { getUsername } = require('./TSP');

const getInvalidatedUuid = (uuid) => `${uuid}/invalid!`;
const getInvalidatedEmail = (email) => `${email}.invalid`;

const invalidateUser = async (app, user) => {
	/*
		Invalidate user, so that:
			a) searching for user.sourceOptions.tspUid should no longer return this user
			b) the user's email is no longer in use (it's based on the TSP UUID, see TSP.js:59)
	*/
	const userService = app.service('users');
	const accountService = app.service('accounts');

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
	await accountService.patch({ userId: user._id }, accountChanges);
};

const deleteUser = (app, user) => {
	/*
		I'm not sure if we actually need to remove the user, or just set a deletion notice (for cleanup later)
	*/
	const userService = app.service('users');
	return Promise.resolve();
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

module.exports = {
	getInvalidatedUuid,
	invalidateUser,
	deleteUser,
	grantAccessToPrivateFiles,
	grantAccessToSharedFiles,
};
