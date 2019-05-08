/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { teamsModel, teamUserModel } = require('../../../../src/services/teams/model');

const store = {
	teamIds: [],
};

// replace later over load from db
const roleId = {
	teamowner: '5bb5c62bfb457b1c3c0c7e14',
	teamadministrator: '5bb5c545fb457b1c3c0c7e13',
	teamleader: '5bb5c49efb457b1c3c0c7e11',
	teamexpert: '5bb5c391fb457b1c3c0c7e10',
	teammember: '5bb5c190fb457b1c3c0c7e0f',
};

const createTeamUser = (userId, schoolId, roleName = 'teammember') => (
	new teamUserModel({ role: roleId[roleName], schoolId, userId })
)._doc;

const createTeam = opt => owner => teamsModel.create({
	name: `${Date.now()}_test`,
	schoolId: opt.schoolId,
	schoolIds: [opt.schoolId],
	userIds: [createTeamUser(owner._id, opt.schoolId, 'teamowner')],
}).then((team) => {
	store.teamIds.push(team._id);
	return team._doc;
});

const addTeamUserToTeam = opt => (id, user, teamRoleName) => teamsModel.findOneAndUpdate(
	{ _id: id },
	{ $push: { userIds: createTeamUser(user._id, opt.schoolId, teamRoleName) } },
	{ new: true },
).lean().exec();

const getTeamById = id => teamsModel.findById(id).lean().exec();

const removeOneTeam = id => teamsModel.findOneAndRemove({ _id: id }).exec();

const removeManyTeams = ids => teamsModel.deleteMany({ _ids: { $in: ids } }).exec();

const teamServices = app => app.service('teams');

const cleanup = async () => {
	await removeManyTeams(store.userIds);
	store.userIds = [];
};

module.exports = (app, opt) => ({
	create: createTeam(opt),
	getById: getTeamById,
	addTeamUserToTeam: addTeamUserToTeam(opt),
	service: teamServices(app),
	roleId,
	createUser: createTeamUser,
	removeOne: removeOneTeam,
	removeMany: removeManyTeams,
	cleanup,
});
