const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { userModel: UserModel } = require('../src/services/user/model'); // mongoose.model('user');
const { teamsModel: TeamsModel } = require('../src/services/teams/model'); // mongoose.model('team');

const equal = (id1, id2) => id1.toString() === id2.toString();

const filterTeamWithMissingSchoolIds = (teams = []) =>
	teams.filter((team) => team.userIds.some((user) => !user.schoolId));

const selectTeamUserWithoutSchoolIds = (teams = []) => {
	const usersIds = [];
	teams.forEach((team) => {
		team.userIds.forEach((teamUser) => {
			if (teamUser && !teamUser.schoolId && teamUser.userId) {
				usersIds.push(teamUser.userId);
			}
		});
	});
	// map to uniq id array
	return [...new Set(usersIds)];
};

const idsToOrCondition = (ids = []) => ids.map((_id) => ({ _id }));

const getReducer = (users = []) => (array, teamUser) => {
	// skip and remove not existing teamUser
	if (!teamUser || !typeof teamUser === 'object' || !teamUser.userId) {
		return array;
	}
	// already exist
	if (teamUser.schoolId) {
		array.push(teamUser);
		return array;
	}

	const baseUser = users.find(({ _id }) => equal(teamUser.userId, _id));
	if (!baseUser || !baseUser.schoolId) {
		return array;
	}

	teamUser.schoolId = baseUser.schoolId;

	array.push(teamUser);
	return array;
};

/**
 * Fix userIds in teams that are:
 * - miss schoolId
 * - null
 * - undefined
 * - has only userId inside and not a teamUserObject
 * It handle and fix also not existing users, that are linked in teams. this teamUsers are removed.
 *
 * It do NOT touched the schoolIds array that are related if users removed.
 * Because it should not modified the team vs school permissions.
 *
 * It can also handle the case that all is fine. :P
 */
module.exports = {
	up: async function up() {
		await connect();
		let teamsForFixing;
		let users;
		let fixTeamUsersReducer;
		// pre conditions and data selects
		try {
			// TeamsModel.find({ 'userIds.0.schoolId': { $exists: true } })
			const teams = await TeamsModel.find({}).lean().exec();
			teamsForFixing = filterTeamWithMissingSchoolIds(teams);
			const userIdsForFixing = selectTeamUserWithoutSchoolIds(teamsForFixing);
			const $or = idsToOrCondition(userIdsForFixing);
			users = await UserModel.find({ $or }).select('schoolId').lean().exec();
			fixTeamUsersReducer = getReducer(users);
		} catch (err) {
			error('Pre select for data failed.', err);
		}

		// pre fix team data
		info(
			`Found ${teamsForFixing.length} teams for fixing.`,
			teamsForFixing.map((team) => team._id)
		);
		teamsForFixing.forEach((team) => {
			team.userIds = team.userIds.reduce(fixTeamUsersReducer, []);
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
		info('Nothing to do!');
	},
};
