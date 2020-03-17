const { userModel, displayName } = require('../user/model');
const { schoolModel } = require('../school/model');
const roleModel = require('../role/model');

const getUserData = (userId) => userModel.findOne(
	{ _id: userId },
	{
		_id: 1, firstName: 1, lastName: 1, roles: 1, email: 1, schoolId: 1,
	},
).lean().exec();

const getSchoolData = (schoolId) => schoolModel.findOne(
	{ _id: schoolId },
	{
		_id: 1, name: 1,
	},
).lean().exec();

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

const buildAddUserMessage = async (data) => {
	const { userId, team, course } = data;
	// todo: check if school uses messenger
	const user = await getUserData(userId);
	const school = await getSchoolData(user.schoolId);
	const {
		teacherRoleId, adminRoleId, teamAdminId, teamLeaderId, teamOwnerId,
	} = await getRoles();
	const rooms = [];
	if (course) {
		rooms.push({
			id: course._id.toString(),
			name: course.name,
			type: 'course',
			bidirectional: (course.features || []).includes('messenger'),
			is_moderator: course.teacherIds.some(
				(el) => el.toString() === userId.toString() || el.toString() === userId.toString(),
			),
		});
	}
	if (team) {
		rooms.push({
			id: team._id.toString(),
			name: team.name,
			type: 'team',
			bidirectional: (team.features || []).includes('messenger'),
			is_moderator: team.userIds.some(
				(el) => el.userId.toString() === userId.toString()
					&& [teamAdminId, teamLeaderId, teamOwnerId].includes(el.role.toString()),
			),
		});
	}
	const message = {
		method: 'adduser',
		school: {
			id: school._id.toString(),
			has_allhands_channel: true,
			name: school.name,
			email: user.email,
		},
		user: {
			id: `${user._id.toString()}@matrix.schul-cloud.org`,
			name: displayName(user),
			is_school_admin: user.roles.some((el) => el.toString() === adminRoleId.toString()),
			is_school_teacher: user.roles.some((el) => el.toString() === teacherRoleId.toString()),
		},
		rooms,
	};
	return message;
};


module.exports = { buildAddUserMessage };
