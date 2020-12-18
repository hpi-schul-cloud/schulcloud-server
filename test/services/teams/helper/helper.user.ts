import mongoose from 'mongoose';
import { TEST_HASH, TEST_PW } from '../../../../config/globals';
import appPromise from '../../../../src/app';
import { BadRequest } from '../../../../src/errors';
import { warning } from '../../../../src/logger/index';
import accountModel from '../../../../src/services/account/model';
import rolesModel from '../../../../src/services/role/model';
import { userModel } from '../../../../src/services/user/model';

const { ObjectId } = mongoose.Types;
const AT = '@schul-cloud.org';

if (TEST_PW === '') warning('TEST_PW is not defined');
if (TEST_HASH === '') warning('TEST_HASH is not defined');

const REQUEST_PARAMS = {
	headers: { 'content-type': 'application/json' },
	provider: 'rest',
};

const getToken = async ({ userId }) => {
	const app = await appPromise;
	const result = app.service('authentication').create(
		{
			strategy: 'local',
			username: userId + AT,
			password: TEST_PW,
		},
		REQUEST_PARAMS
	);
	return result.accessToken;
};

const getRoleByKey = (key, value) =>
	rolesModel
		.find({
			[key]: value,
		})
		.then(([role]) => role);

const createUser = async (userId, roleName = 'student', schoolId = '5f2987e020834114b8efd6f8') => {
	if (!['expert', 'student', 'teacher', 'parent', 'administrator', 'superhero'].includes(roleName)) {
		throw BadRequest(`You want to test a not related role .${roleName}`);
	}

	const role = await getRoleByKey('name', roleName);

	return userModel.create({
		_id: userId,
		email: userId + AT,
		schoolId,
		firstName: userId,
		lastName: 'GeneratedTestUser',
		roles: [role._id],
	});
};

const createAccount = (userId) =>
	accountModel.create({
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
		userId: user._id,
		account,
		user,
		accessToken,
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
