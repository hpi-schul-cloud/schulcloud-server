/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Tool = require('../src/services/ltiTool/model');

// this migration creates a new ltitool template for bigbluebutton
// check the url is correct.

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb
const name = 'Video-Konferenz mit BigBlueButton';
const url = 'BBB_URL';
info('check the url is correct', { url });
module.exports = {
	up: async function up() {
		if (process.env.SC_THEME !== 'n21') {
			Promise.resolve('this migration will apply changes only if SC_THEME=n21');
			return;
		}
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const existingBbbTool = await Tool.findOne({
			name,
			isTemplate: true,
		})
			.lean()
			.exec();
		if (existingBbbTool !== null) {
			error('there is already a bbb tool in collection ltitools, exit', { existingBbbTool });
			Promise.reject();
			return;
		}
		const bbbTool = new Tool({
			name,
			url,
			isTemplate: true,
			isLocal: true,
			logo_url: '/images/tools/bbb/available.png',
			secret: 'none',
			key: 'none',
		});
		await bbbTool.save();
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		if (process.env.SC_THEME !== 'n21') {
			Promise.resolve('this migration will apply changes only if SC_THEME=n21');
			return;
		}
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await Tool.deleteOne({
			name,
			isTemplate: true,
		})
			.lean()
			.exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
