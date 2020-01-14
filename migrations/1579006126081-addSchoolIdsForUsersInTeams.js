const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');


const { userModel: UserModel } = require('../src/services/user/model'); // mongoose.model('user');
const { teamsModel: TeamsModel } = require('../src/services/teams/model'); // mongoose.model('team');

const equal = (id1, id2) => id1.toString() === id2.toString();

const filterTeamWithMissingSchoolIds = (teams) => teams.filter((team) => team.userIds.some((user) => !user.schoolId));

const selectTeamUserWithoutSchoolIds = (teams) => {
	const usersIds = [];
	teams.forEach((team) => {
		team.userIds.forEach(({ userId, schoolId }) => {
			if (!schoolId) {
				usersIds.push(userId);
			}
		});
	});
	// map to uniq id array
	return [...new Set(usersIds)];
};

const idsToOrCondition = (ids) => ids.map((_id) => ({ _id }));


module.exports = {
	up: async function up() {
		await connect();
		let teamsForFixing; let users;
		// pre conditions and data selects
		try {
			// TeamsModel.find({ 'userIds.0.schoolId': { $exists: true } })
			const teams = await TeamsModel.find({}).lean().exec();
			teamsForFixing = filterTeamWithMissingSchoolIds(teams);
			const userIdsForFixing = selectTeamUserWithoutSchoolIds(teamsForFixing);
			const $or = idsToOrCondition(userIdsForFixing);
			users = await UserModel.find({ $or }).select('schoolId').lean().exec();
		} catch (err) {
			error('Pre select for data failed.', err);
		}

		// pre fix team data
		info(`Found ${teamsForFixing.length} teams for fixing.`, teamsForFixing.map((team) => team._id));
		teamsForFixing.forEach((team) => {
			team.userIds.forEach((user) => {
				if (!user.schoolId) {
					const baseUser = users.find(({ _id }) => equal(user.userId, _id));
					user.schoolId = baseUser.schoolId;
				}
			});
		});

		// create querys for fixes
		const promises = teamsForFixing.map(({ _id, userIds }) => {
			const $set = { userIds };
			return TeamsModel.update({ _id }, { $set }).lean().exec();
		});

		// querying fixes
		const erg = await Promise.all(promises).catch((err) => {
			error('Something go wrong!', err);
		});

		info(erg);

		await close();
	},

	down: async function down() {
		await connect();
		error('Pech gehabt! :-) ');
		await close();
	},
};
