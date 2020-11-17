const { Configuration } = require('@hpi-schul-cloud/commons');
const { userModel, displayName } = require('../user/model');
const { schoolModel, SCHOOL_FEATURES } = require('../school/model');
const roleModel = require('../role/model');
const { courseModel, COURSE_FEATURES } = require('../user-group/model');
const { teamsModel, TEAM_FEATURES } = require('../teams/model');
const { ObjectId } = require('../../helper/compare');
const { asyncFilter } = require('../../utils/array');
const { getAllCourseUserIds } = require('../user-group/logic/courses');

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
				name: 1,
				userIds: 1,
				teacherIds: 1,
				substitutionIds: 1,
				features: 1,
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
				name: 1,
				userIds: 1,
				features: 1,
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

const expandContentIds = async (data) => {
	if (!data.user && data.userId) {
		data.user = await getUserData(data.userId);
		data.schoolId = data.schoolId || (data.user && data.user.schoolId);
	}

	if (!data.course && data.courseId) {
		data.course = await getCourseData(data.courseId);
		data.schoolId = data.schoolId || (data.course && data.course.schoolId);
	}

	if (!data.team && data.teamId) {
		data.team = await getTeamData(data.teamId);
		data.schoolId = data.schoolId || (data.team && data.team.schoolId);
	}

	if (!data.school && data.schoolId) {
		data.school = await getSchoolData(data.schoolId);
	}

	return data;
};

const messengerIsActivatedForSchool = (school) => {
	return school && Array.isArray(school.features) && school.features.includes(SCHOOL_FEATURES.MESSENGER);
};

const isTeamModerator = (team, userId, moderatorRoles) => {
	if (!userId || !moderatorRoles) {
		return false;
	}

	const { teamAdminId, teamLeaderId, teamOwnerId } = moderatorRoles;
	return team.userIds.some((user) => {
		if (!ObjectId.equal(user.userId, userId)) {
			return false; // other user
		}
		return [teamAdminId, teamLeaderId, teamOwnerId].includes(user.role.toString());
	});
};

const isCourseModerator = (course, userId) => {
	if (!userId) {
		return false;
	}

	return course.teacherIds.concat(course.substitutionIds).some((moderatorId) => ObjectId.equal(moderatorId, userId));
};

const buildMatrixUserId = (userId) => {
	const servername = Configuration.get('MATRIX_MESSENGER__SERVERNAME');
	return `@sso_${userId.toString()}:${servername}`;
};

/*
{
  "method": "addUser",
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

const buildCourseObject = (course, userId = null) => {
	return {
		id: course._id.toString(),
		name: course.name,
		description: 'Kurs',
		type: 'course',
		bidirectional: (course.features || []).includes(COURSE_FEATURES.MESSENGER),
		is_moderator: isCourseModerator(course, userId),
	};
};

const buildTeamObject = (team, userId = null, moderatorRoles = null) => {
	return {
		id: team._id.toString(),
		name: team.name,
		description: 'Team',
		type: 'team',
		bidirectional: (team.features || []).includes(TEAM_FEATURES.MESSENGER),
		is_moderator: isTeamModerator(team, userId, moderatorRoles),
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
	const result = {
		method: 'addUser',
		user: {
			id: buildMatrixUserId(user._id),
			name: displayName(user),
		},
	};

	if (isAdmin && Configuration.has('MATRIX_MESSENGER__WELCOME_MESSAGE_ADMIN')) {
		result.welcome = {
			text: Configuration.get('MATRIX_MESSENGER__WELCOME_MESSAGE_ADMIN'),
		};
	} else if (isTeacher && Configuration.has('MATRIX_MESSENGER__WELCOME_MESSAGE_TEACHER')) {
		result.welcome = {
			text: Configuration.get('MATRIX_MESSENGER__WELCOME_MESSAGE_TEACHER'),
		};
	} else if (Configuration.has('MATRIX_MESSENGER__WELCOME_MESSAGE_STUDENT')) {
		result.welcome = {
			text: Configuration.get('MATRIX_MESSENGER__WELCOME_MESSAGE_STUDENT'),
		};
	}

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
	result.rooms = rooms;

	return result;
};

const buildAddUserMessage = async (data) => {
	if (data.fullSync) {
		data.courses = await getAllCourseDataForUser(data.userId);
		data.teams = await getAllTeamsDataForUser(data.userId);
	}
	return buildMessageObject(data);
};

const buildDeleteUserMessage = async (data) => {
	return {
		method: 'removeUser',
		user: {
			id: buildMatrixUserId(data.userId),
		},
	};
};

const buildAddTeamMessage = async (data) => {
	// room
	const room = buildTeamObject(data.team);

	// members
	const moderatorRoles = await getRoles();
	const membersWithMessengerActivated = await asyncFilter(data.team.userIds, async (teamUser) => {
		if (ObjectId.equal(teamUser.schoolId, data.team.schoolId)) {
			return true;
		}
		const school = await getSchoolData(teamUser.schoolId);
		return messengerIsActivatedForSchool(school);
	});
	const members = membersWithMessengerActivated.map((teamUser) => {
		return {
			id: buildMatrixUserId(teamUser.userId),
			is_moderator: isTeamModerator(data.team, teamUser.userId, moderatorRoles),
		};
	});

	return {
		method: 'addRoom',
		room,
		members,
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

const buildAddCourseMessage = async (data) => {
	// room
	const room = buildCourseObject(data.course);

	// members
	const members = getAllCourseUserIds(data.course).map((userId) => {
		return {
			id: buildMatrixUserId(userId),
			is_moderator: isCourseModerator(data.course, userId),
		};
	});

	return {
		method: 'addRoom',
		room,
		members,
	};
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

module.exports = {
	expandContentIds,
	messengerIsActivatedForSchool,
	buildAddUserMessage,
	buildDeleteUserMessage,
	buildAddTeamMessage,
	buildDeleteTeamMessage,
	buildAddCourseMessage,
	buildDeleteCourseMessage,
};
