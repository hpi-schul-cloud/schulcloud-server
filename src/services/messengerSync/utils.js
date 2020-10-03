const { Configuration } = require('@schul-cloud/commons');
const { userModel, displayName } = require('../user/model');
const { schoolModel, SCHOOL_FEATURES } = require('../school/model');
const roleModel = require('../role/model');
const { courseModel, COURSE_FEATURES } = require('../user-group/model');
const { teamsModel, TEAM_FEATURES } = require('../teams/model');
const { ObjectId } = require('../../helper/compare');

const getUserData = (userId) =>
	userModel
		.findOne(
			{ _id: userId },
			{
				_id: 1,
				firstName: 1,
				lastName: 1,
				roles: 1,
				email: 1,
				schoolId: 1,
			}
		)
		.lean()
		.exec();

const getCourseData = (courseId) =>
	courseModel
		.findOne(
			{ _id: courseId },
			{
				_id: 1,
				schoolId: 1,
			}
		)
		.lean()
		.exec();

const getTeamData = (teamId) =>
	teamsModel
		.findOne(
			{ _id: teamId },
			{
				_id: 1,
				schoolId: 1,
			}
		)
		.lean()
		.exec();

const getSchoolData = (schoolId) =>
	schoolModel
		.findOne(
			{ _id: schoolId },
			{
				_id: 1,
				name: 1,
				features: 1,
			}
		)
		.lean()
		.exec();

const getAllCourseDataForUser = (userId) =>
	courseModel
		.find(
			{
				$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
			},
			{
				_id: 1,
				name: 1,
				userIds: 1,
				teacherIds: 1,
				substitutionIds: 1,
				features: 1,
			}
		)
		.lean()
		.exec();

const getAllTeamsDataForUser = (userId) =>
	teamsModel.find(
		{ userIds: { $elemMatch: { userId } } },
		{
			_id: 1,
			name: 1,
			userIds: 1,
			features: 1,
		}
	);

let roles;

const getRoles = async () => {
	if (!roles) {
		const [teacherRoleId, adminRoleId, teamOwnerId, teamAdminId, teamLeaderId] = await Promise.all([
			roleModel
				.findOne({ name: 'teacher' }, { _id: 1 })
				.lean()
				.exec()
				.then((r) => r._id),
			roleModel
				.findOne({ name: 'administrator' }, { _id: 1 })
				.lean()
				.exec()
				.then((r) => r._id),
			roleModel
				.findOne({ name: 'teamowner' }, { _id: 1 })
				.lean()
				.exec()
				.then((r) => r._id.toString()),
			roleModel
				.findOne({ name: 'teamadministrator' }, { _id: 1 })
				.lean()
				.exec()
				.then((r) => r._id.toString()),
			roleModel
				.findOne({ name: 'teamleader' }, { _id: 1 })
				.lean()
				.exec()
				.then((r) => r._id.toString()),
		]);
		roles = {
			teacherRoleId,
			adminRoleId,
			teamOwnerId,
			teamAdminId,
			teamLeaderId,
		};
	}
	return roles;
};

/*
{
  "method": "adduser",
  "welcome": {
    "text": "Welcome to messenger"
  },
  "user": {
    "id": "@sso_0000d224816abba584714c9c:matrix.server.com",
    "name": "Marla Mathe",
    "email": "(optional)",
    "password": "(optional)"
  },
  "rooms": [
    {
      "type": "(optional, default: room)",
      "id": "0000dcfbfb5c7a3f00bf21ab",
      "name": "Mathe",
      "description": "Kurs",
      "bidirectional": false,
      "is_moderator": false
    }
  ]
}
*/

const buildCourseObject = (course, userId) => ({
	id: course._id.toString(),
	name: course.name,
	description: 'Kurs',
	type: 'course',
	bidirectional: (course.features || []).includes(COURSE_FEATURES.MESSENGER),
	is_moderator: course.teacherIds
		.concat(course.substitutionIds)
		.some((moderatorId) => ObjectId.equal(moderatorId, userId)),
});

const buildTeamObject = async (team, userId, moderatorRoles) => {
	const { teamAdminId, teamLeaderId, teamOwnerId } = moderatorRoles;
	const isModerator = team.userIds.some((user) => {
		if (!ObjectId.equal(user.userId, userId)) {
			return false; // other user
		}
		return [teamAdminId, teamLeaderId, teamOwnerId].includes(user.role.toString());
	});
	return {
		id: team._id.toString(),
		name: team.name,
		description: 'Team',
		type: 'team',
		bidirectional: (team.features || []).includes(TEAM_FEATURES.MESSENGER),
		is_moderator: isModerator,
	};
};

const buildMessageObject = async (data) => {
	const user = data.user || (await getUserData(data.userId));
	const school = data.school || (await getSchoolData(user.schoolId));
	const moderatorRoles = await getRoles();
	const schoolRoomEnabled = (school.features || []).includes(SCHOOL_FEATURES.MESSENGER_SCHOOL_ROOM);
	const teachersRoomEnabled = true;
	const isTeacher = user.roles.some((roleId) => ObjectId.equal(roleId, moderatorRoles.teacherRoleId));
	const isAdmin = user.roles.some((roleId) => ObjectId.equal(roleId, moderatorRoles.adminRoleId));
	const isTeacheOrAdmin = isTeacher || isAdmin;

	const rooms = [];
	if (data.courses) {
		data.courses.forEach((course) => {
			rooms.push(buildCourseObject(course, data.userId));
		});
	}
	if (data.teams) {
		await Promise.all(
			data.teams.map(async (team) => {
				const teamObject = await buildTeamObject(team, data.userId, moderatorRoles);
				rooms.push(teamObject);
			})
		);
	}
	if (schoolRoomEnabled) {
		rooms.push({
			type: 'news',
			id: school._id.toString(),
			name: 'Ankündigungen',
			description: school.name,
			bidirectional: false,
			is_moderator: isTeacheOrAdmin,
		});
	}
	if (teachersRoomEnabled && isTeacheOrAdmin) {
		rooms.push({
			type: 'teachers',
			id: school._id.toString(),
			name: 'Lehrerzimmer',
			description: school.name,
			bidirectional: true,
			is_moderator: isAdmin,
		});
	}

	const servername = Configuration.get('MATRIX_SERVERNAME');

	return {
		method: 'adduser',
		user: {
			id: `@sso_${user._id.toString()}:${servername}`,
			name: displayName(user),
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

const buildDeleteCourseMessage = async (data) => {
	return {
		method: 'removeRoom',
		room: {
			type: 'course',
			id: data.courseId,
		},
	};
};

const buildDeleteTeamMessage = async (data) => {
	return {
		method: 'removeRoom',
		room: {
			type: 'team',
			id: data.teamId,
		},
	};
};

const messengerIsActivatedForSchool = async (data) => {
	if (!data.user && data.userId) {
		data.user = await getUserData(data.userId);
		data.schoolId = data.user.schoolId;
	}

	if (!data.course && data.courseId) {
		data.course = await getCourseData(data.courseId);
		data.schoolId = data.course.schoolId;
	}

	if (!data.team && data.teamId) {
		data.team = await getTeamData(data.teamId);
		data.schoolId = data.team.schoolId;
	}

	if (!data.school && data.schoolId) {
		data.school = await getSchoolData(data.schoolId);
	}

	return data.school && Array.isArray(data.school.features) && data.school.features.includes(SCHOOL_FEATURES.MESSENGER);
};

module.exports = {
	buildAddUserMessage,
	buildDeleteCourseMessage,
	buildDeleteTeamMessage,
	messengerIsActivatedForSchool,
};
