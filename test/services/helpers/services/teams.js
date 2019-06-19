/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { teamsModel, teamUserModel } = require('../../../../src/services/teams/model');
<<<<<<< HEAD

let createdTeamIds = [];

// todo replace later over load from db
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
=======
const Role = require('../../../../src/services/role/model');

let createdTeamIds = [];

const createTeamUser = async (userId, schoolId, roleName = 'teammember') => {
	const roleId = (await Role.findOne({ name: roleName }))._id;
	return (new teamUserModel({ role: roleId, schoolId, userId }))._doc;
};

const createTeam = opt => async owner => teamsModel.create({
	name: `${Date.now()}_test`,
	schoolId: opt.schoolId,
	schoolIds: [opt.schoolId],
	userIds: [await createTeamUser(owner._id, opt.schoolId, 'teamowner')],
>>>>>>> develop
}).then((team) => {
	createdTeamIds.push(team._id.toString());
	return team._doc;
});

<<<<<<< HEAD
const addTeamUserToTeam = opt => (id, user, teamRoleName) => teamsModel.findOneAndUpdate(
	{ _id: id },
	{ $push: { userIds: createTeamUser(user._id, opt.schoolId, teamRoleName) } },
=======
const addTeamUserToTeam = opt => async (id, user, teamRoleName) => teamsModel.findOneAndUpdate(
	{ _id: id },
	{ $push: { userIds: await createTeamUser(user._id, opt.schoolId, teamRoleName) } },
>>>>>>> develop
	{ new: true },
).lean().exec();

const getTeamById = id => teamsModel.findById(id).lean().exec();

const removeOneTeam = id => teamsModel.findOneAndRemove({ _id: id }).exec();

const removeManyTeams = ids => teamsModel.deleteMany({ _ids: { $in: ids } }).exec();

// const teamServices = app => app.service('teams');

<<<<<<< HEAD
const cleanup = async () => {
	await removeManyTeams(createdTeamIds);
	createdTeamIds = [];
=======
const cleanup = () => {
	const ids = createdTeamIds;
	createdTeamIds = [];
	return removeManyTeams(ids);
>>>>>>> develop
};

module.exports = (app, opt) => ({
	create: createTeam(opt),
	getById: getTeamById,
	addTeamUserToTeam: addTeamUserToTeam(opt),
<<<<<<< HEAD
	// service: teamServices(app),
	roleId,
=======
>>>>>>> develop
	createUser: createTeamUser,
	removeOne: removeOneTeam,
	removeMany: removeManyTeams,
	cleanup,
	info: createdTeamIds,
});
