/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
const { teamsModel, teamUserModel } = require('../../../../src/services/teams/model');
const Role = require('../../../../src/services/role/model');

let createdTeamIds = [];

const createTeamUser = async (userId, schoolId, roleName = 'teammember') => {
	const roleId = (await Role.findOne({ name: roleName }))._id;
	return new teamUserModel({ role: roleId, schoolId, userId })._doc;
};

const createTeam = () => async (owner) =>
	teamsModel
		.create({
			name: `${Date.now()}_test`,
			schoolId: owner.schoolId,
			schoolIds: [owner.schoolId],
			userIds: [await createTeamUser(owner._id, owner.schoolId, 'teamowner')],
		})
		.then((team) => {
			createdTeamIds.push(team._id.toString());
			return team._doc;
		});

const addTeamUserToTeam = (opt) => async (id, user, teamRoleName) =>
	teamsModel
		.findOneAndUpdate(
			{ _id: id },
			{ $push: { userIds: await createTeamUser(user._id, opt.schoolId, teamRoleName) } },
			{ new: true }
		)
		.lean()
		.exec();

const getTeamById = (id) => teamsModel.findById(id).lean().exec();

const removeOneTeam = (id) => teamsModel.findOneAndRemove({ _id: id }).lean().exec();

const removeManyTeams = (ids) =>
	teamsModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();

// const teamServices = app => app.service('teams');

const cleanup = () => {
	if (createdTeamIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdTeamIds;
	createdTeamIds = [];
	return removeManyTeams(ids);
};

module.exports = (app, opt) => ({
	create: createTeam(opt),
	getById: getTeamById,
	addTeamUserToTeam: addTeamUserToTeam(opt),
	createUser: createTeamUser,
	removeOne: removeOneTeam,
	removeMany: removeManyTeams,
	cleanup,
	info: createdTeamIds,
});
