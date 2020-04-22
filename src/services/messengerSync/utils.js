const { Configuration } = require('@schul-cloud/commons');
const { userModel, displayName } = require('../user/model');
const { schoolModel } = require('../school/model');
const roleModel = require('../role/model');
const { courseModel } = require('../user-group/model');
const { teamsModel } = require('../teams/model');
const { ObjectId } = require('../../helper/compare');

const getUserData = (userId) => userModel.findOne(
	{ _id: userId },
	{
		_id: 1, firstName: 1, lastName: 1, roles: 1, email: 1, schoolId: 1,
	},
).lean().exec();

const getSchoolData = (schoolId) => schoolModel.findOne(
	{ _id: schoolId },
	{
		_id: 1, name: 1, features: 1,
	},
).lean().exec();

const getAllCourseDataForUser = (userId) => courseModel.find(
	{
		$or: [
			{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId },
		],
	},
	{
		_id: 1, name: 1, userIds: 1, teacherIds: 1, substitutionIds: 1, features: 1,
	},
).lean().exec();

const getAllTeamsDataForUser = (userId) => teamsModel.find(
	{ userIds: { $elemMatch: { userId } } },
	{
		_id: 1, name: 1, userIds: 1, features: 1,
	},
);

let roles;

const getRoles = async () => {
	if (!roles) {
		const [teacherRoleId, adminRoleId, teamOwnerId, teamAdminId, teamLeaderId] = await Promise.all([
			roleModel.findOne({ name: 'teacher' }, { _id: 1 }).lean().exec().then((r) => r._id),
			roleModel.findOne({ name: 'administrator' }, { _id: 1 }).lean().exec().then((r) => r._id),
			roleModel.findOne({ name: 'teamowner' }, { _id: 1 }).lean().exec().then((r) => r._id.toString()),
			roleModel.findOne({ name: 'teamadministrator' }, { _id: 1 }).lean().exec().then((r) => r._id.toString()),
			roleModel.findOne({ name: 'teamleader' }, { _id: 1 }).lean().exec().then((r) => r._id.toString()),
		]);
		roles = {
			teacherRoleId, adminRoleId, teamOwnerId, teamAdminId, teamLeaderId,
		};
	}
	return roles;
};

/* {
	method: 'adduser',
    school:{
		id: 1223435,
		has_allhands_channel : true,
		name: "Peanuts High"
    },
    user: {
        id: 1234566@matrix.schul-cloud.org,
        name: "Joe Cool"",
		is_school_admin: true,
		is_school_teacher: true,
    },
    room: {
		id: 1234566,
		name: 'Mathe 6b',
		type: 'course',
		is_moderator: false,
		bidirectional: true
    }
} */

const buildCourseObject = (course, userId) => ({
	id: course._id.toString(),
	name: course.name,
	type: 'course',
	bidirectional: (course.features || []).includes('messenger'),
	is_moderator: course.teacherIds.concat(course.substitutionIds).some(
		(moderatorId) => ObjectId.equal(moderatorId, userId),
	),
});


const buildTeamObject = async (team, userId, moderatorRoles) => {
	const { teamAdminId, teamLeaderId, teamOwnerId } = moderatorRoles;
	return {
		id: team._id.toString(),
		name: team.name,
		type: 'team',
		bidirectional: (team.features || []).includes('messenger'),
		is_moderator: team.userIds.some(
			(user) => ObjectId.equal(user.userId, userId)
				&& [teamAdminId, teamLeaderId, teamOwnerId].includes(user.role.toString()),
		),
	};
};

const buildMessageObject = async (data) => {
	const user = data.user || await getUserData(data.userId);
	const school = data.school || await getSchoolData(user.schoolId);
	const moderatorRoles = await getRoles();
	const rooms = [];
	if (data.courses) {
		data.courses.forEach((course) => {
			rooms.push(buildCourseObject(course, data.userId));
		});
	}
	if (data.teams) {
		await Promise.all(data.teams.map(async (team) => {
			const teamObject = await buildTeamObject(team, data.userId, moderatorRoles);
			rooms.push(teamObject);
		}));
	}
	const servername = Configuration.get('MATRIX_SERVERNAME');

	return {
		method: 'adduser',
		school: {
			id: school._id.toString(),
			has_allhands_channel: true,
			name: school.name,
		},
		user: {
			id: `@sso_${user._id.toString()}:${servername}`,
			name: displayName(user),
			email: user.email,
			is_school_admin: user.roles.some((roleId) => ObjectId.equal(roleId, moderatorRoles.adminRoleId)),
			is_school_teacher: user.roles.some((roleId) => ObjectId.equal(roleId, moderatorRoles.teacherRoleId)),
		},
		rooms,
	};
};

const buildAddUserMessage = async (data) => {
	if (data.fullSync) {
		data.courses = await getAllCourseDataForUser(data.userId);
		data.teams = await getAllTeamsDataForUser(data.userId);
	}
	return buildMessageObject(data);
};

const messengerIsActivatedForSchool = async (data) => {
	if (data.userId) {
		data.user = await getUserData(data.userId);
		data.school = await getSchoolData(data.user.schoolId);
	}

	if (data.schoolId) {
		data.school = await getSchoolData(data.schoolId);
	}

	return data.school && Array.isArray(data.school.features) && data.school.features.includes('messenger');
};

module.exports = { buildAddUserMessage, messengerIsActivatedForSchool };
