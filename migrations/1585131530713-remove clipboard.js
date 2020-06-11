const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;
const thingSchema = new Schema({}, { strict: false });
const Clipboard = mongoose.model('clipboards098765', thingSchema, 'clipboards');

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.

		const demoItem = new Clipboard({
			foo: 'take care, the collection exist, otherwise direct removal fails',
		});
		await demoItem.save();

		info('drop collection clipboards...');
		const success = await Clipboard.collection.drop();
		if (success !== true) {
			throw new Error('error while drop clipboards from database');
		}
		info('collection clipboards dropped successfully');

		// ////////////////////////////////////////////////////
		await close();
	},
};
