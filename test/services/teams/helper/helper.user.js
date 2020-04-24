const { BadRequest } = require('@feathersjs/errors');
const { ObjectId } = require('mongoose').Types;
const rolesModel = require('../../../../src/services/role/model.js');
const { userModel } = require('../../../../src/services/user/model.js');
const accountModel = require('../../../../src/services/account/model.js');
// const app = require(SRC + 'app');
const app = require('../../../../src/app');

const {
	TEST_PW,
	TEST_HASH,
} = require('../../../../config/globals');

const AT = '@schul-cloud.org';

const { warning } = require('../../../../src/logger/index');

if (TEST_PW === '') warning('TEST_PW is not defined');
if (TEST_HASH === '') warning('TEST_HASH is not defined');

const REQUEST_PARAMS = {
	headers: { 'content-type': 'application/json' },
	provider: 'rest',
};

const getToken = async ({ userId }) => {
	const result = app.service('authentication').create({
		strategy: 'local',
		username: userId + AT,
		password: TEST_PW,
	}, REQUEST_PARAMS);
	return result.accessToken;
};

const getRoleByKey = (key, value) => rolesModel.find({
	[key]: value,
})
	.then(([role]) => role);

const createUser = async (userId, roleName = 'student', schoolId = '0000d186816abba584714c5f') => {
	if (![
		'expert',
		'student',
		'teacher',
		'parent',
		'administrator',
		'superhero',
	].includes(roleName)) {
		throw BadRequest(`You want to test a not related role .${roleName}`);
	}

	const role = await getRoleByKey('name', roleName);

	return userModel.create({
		_id: userId,
		email: userId + AT,
		schoolId,
		firstName: userId,
		lastName: 'GeneratedTestUser',
		roles: [
			role._id,
		],
	});
};

const createAccount = (userId) => accountModel.create({
	username: userId + AT,
	password: TEST_HASH,
	userId,
	activated: true,
});

const setupUser = async (roleName, schoolId) => {
	const userId = new ObjectId();
	const user = await createUser(userId, roleName, schoolId);
	const account = await createAccount(user._id);
	const accessToken = await getToken(account);
	return {
		userId: user._id, account, user, accessToken,
	};
};

const deleteUser = async (userId) => {
	if (typeof userId === 'object' && userId.userId !== undefined) userId = userId.userId;

	const email = userId + AT;
	await userModel.deleteOne({ email }); // todo: add error handling if not exist
	await accountModel.deleteOne({ username: email });
};

module.exports = {
	setupUser,
	getToken,
	getRoleByKey,
	deleteUser,
};
