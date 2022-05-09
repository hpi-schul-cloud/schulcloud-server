const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const Helpdocuments = mongoose.model(
	'Helpdocuments20220509',
	new mongoose.Schema(
		{
			theme: { type: String, required: true },
		},
		{
			timestamps: true,
		}
	),
	'helpdocuments'
);

module.exports = {
	up: async function up() {
		await connect();
		await Helpdocuments.deleteMany({ theme: 'open' });
		await close();
	},

	down: async function down() {
	},
};
