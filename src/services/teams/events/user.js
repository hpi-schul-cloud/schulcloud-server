const logger = require('winston');

const { teamsModel } = require('../model');

const getTeams = userId => teamsModel.find({ 'userIds.userId': userId }).lean().exec();
const patchTeamUsers = team => teamsModel.findByIdAndUpdate(team._id, { userIds: team.userIds }).lean().exec();
const removeTeam = team => teamsModel.findByIdAndRemove(team._id).lean().exec();

const removeTeamUserFromTeam = (team, userId) => {
	team.userIds = team.userIds.filter(user => user.userId.toString() !== userId);
	return team;
};

const patchOrRemoveTeam = (team) => {
	if (team.userIds.length <= 0) {
		return removeTeam(team);
	}
	return patchTeamUsers(team);
};

const deleteUser = (app) => {
	app.service('users').on('removed', async (result) => {
		const userId = result._id.toString();
		let teams = await getTeams(userId);
		teams = teams.map(team => removeTeamUserFromTeam(team, userId));
		const promises = teams.map(team => patchOrRemoveTeam(team));

		const teamIds = teams.map(team => team._id);

		await Promise.all(promises)
			.then(() => {
				logger.info(
					`Remove from user ${userId} from the teams ${teamIds},`
					+ 'if team.userIds empty then removed the team too.',
				);
			})
			.catch((err) => {
				logger.warn(
					`Can not remove from user ${userId} from the teams ${teamIds},`
					+ 'if team.userIds empty then removed the team too.',
					err,
				);
			});
	});
};

module.exports = (app) => {
	deleteUser(app);
};
