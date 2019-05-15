/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = false; // set to true to exclude migration
const name = 'Refactor rcUser pass to secret.';

const database = require('../src/utils/database');

const { userModel } = require('../src/services/rocketChat/model.js');

const run = async () => {
	database.connect();
	console.log('hi');

	const errorHandler = (e) => {
		console.log('Error', e);
		return undefined;
	};

	const rcUsers = await userModel.find({}).exec().catch(errorHandler);

	const promises = rcUsers.map((rcUser) => {
		rcUser.secret = rcUser.pass;
		delete rcUser.pass;
		console.log(rcUser);
		return userModel
			.update({ _id: rcUser._id }, rcUser).exec().catch(errorHandler);
	});

	return Promise.all(promises);
};

module.exports = {
	ran,
	name,
	run,
};
