// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { teamsModel: Teams } = require('../src/services/teams/model');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		const teams = await Teams.find({ 'classIds.0': { $exists: true } }).exec();
		info(`found ${teams.length} teams having classes...`);
		const errors = [];
		for (const team of teams) {
			try {
				info(`start updating team ${String(team._id)}...`);
				const classIds = team.classIds.map((classId) => String(classId));
				info(`following classIds will be removed: ${JSON.stringify(classIds)}`);
				team.classIds = [];
				await team.save();
				info(`updating team ${String(team._id)} finished`);
			} catch (e) {
				const message = `error updating team ${String(team._id)}`;
				errors.push(message);
				error(message, e);
			}
		}
		const teamsAfter = await Teams.find({ 'classIds.0': { $exists: true } }).exec();
		info(`By now, ${teamsAfter.length} teams having classes...`);

		// ////////////////////////////////////////////////////
		await close();

		if (teamsAfter.length !== 0) {
			throw new Error(`there were ${teamsAfter.length} teams not updated successfully!`);
		}

		if (errors.length !== 0) {
			throw new Error(`there were ${errors.length} errors occured!`);
		}
		return Promise.resolve();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		error('check up logs for manually undo this migration');
		// ////////////////////////////////////////////////////
		await close();
		return Promise.resolve();
	},
};
