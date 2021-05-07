// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { classModel } = require('../src/services/user-group/model');
const { schoolModel } = require('../src/services/school/model');
const accountModel = require('../src/services/account/model');
const { userModel } = require('../src/services/user/model');

const updateIndices = async () => {
	alert('Sync inices');
	await connect();

	alert('Updating class indices...');
	await classModel.syncIndexes();

	alert('Updating school indices...');
	await schoolModel.syncIndexes();

	alert('Updating user indices...');
	await userModel.syncIndexes();

	alert('Updating account indices...');
	await accountModel.syncIndexes();

	alert('Done!');
	await close();
};

module.exports = {
	up: updateIndices,
	down: updateIndices,
};
