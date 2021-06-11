// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { userModel } = require('../src/services/user/model');

const updateIndices = async () => {
	alert('Sync indices');
	await connect();

	alert('Updating user indices...');
	await userModel.syncIndexes();

	alert('Done!');
	await close();
};

module.exports = {
	up: updateIndices,
	down: updateIndices,
};
