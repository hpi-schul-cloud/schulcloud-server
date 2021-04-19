const { Configuration } = require('@hpi-schul-cloud/commons');
const { getChannel } = require('../../utils/rabbitmq');
const { getAllCourseUserIds } = require('../user-group/logic/courses');
const { teamsModel } = require('../teams/model');

const ACTIONS = {
	SYNC_USER: 'syncUser',
	SYNC_SCHOOL: 'syncSchool',
	SYNC_TEAM: 'syncTeam',
	SYNC_COURSE: 'syncCourse',
	DELETE_TEAM: 'deleteTeam',
	DELETE_COURSE: 'deleteCourse',
	DELETE_USER: 'deleteUser',
};

let app;
let channelSendInternal;

const sendMessage = (message) => {
	channelSendInternal.sendToQueue(message, { persistent: true });
};

// USER
const requestFullSyncForUser = async (user, schoolSync = false) => {
	const message = {
		action: ACTIONS.SYNC_USER,
		userId: user._id,
		fullSync: true,
		schoolSync,
	};
	sendMessage(message);
};

const requestUserRemoval = async (user) => {
	const message = {
		action: ACTIONS.DELETE_USER,
		userId: user._id,
		schoolId: user.schoolId,
	};
	sendMessage(message);
};

// TEAM
const requestTeamSync = async (team) => {
	const message = {
		action: ACTIONS.SYNC_TEAM,
		teamId: team._id,
	};
	sendMessage(message);
};

const requestSyncForEachTeamUser = async (team) => {
	let fullTeam;
	if (team.userIds) {
		fullTeam = team;
	} else {
		// team creation event does only contain team._id
		fullTeam = await teamsModel.findOne(
			{ _id: team._id },
			{
				_id: 1,
				name: 1,
				userIds: 1,
				features: 1,
			}
		);
	}

	const users = fullTeam.userIds.map((teamUser) => teamUser.userId);

	users.forEach((userId) => {
		const message = {
			action: ACTIONS.SYNC_USER,
			userId,
			teams: [fullTeam],
		};
		sendMessage(message);
	});
};

const requestTeamRemoval = async (team) => {
	const message = {
		action: ACTIONS.DELETE_TEAM,
		teamId: team._id,
		schoolId: team.schoolId,
	};
	sendMessage(message);
};

// COURSE
const requestCourseRemoval = async (course, schoolSync = false) => {
	const message = {
		action: ACTIONS.DELETE_COURSE,
		courseId: course._id,
		schoolId: course.schoolId,
		schoolSync,
	};
	sendMessage(message);
};

const requestAddCourse = async (course) => {
	const message = {
		action: ACTIONS.SYNC_COURSE,
		courseId: course._id,
	};
	sendMessage(message);
};

const requestCourseSync = async (course) => {
	if (course.isArchived) {
		requestCourseRemoval(course);
	} else {
		requestAddCourse(course);
	}
};

const requestSyncForEachCourseUser = async (course) => {
	if (course.isArchived) {
		requestCourseRemoval(course);
	} else {
		getAllCourseUserIds(course).forEach((userId) => {
			const message = {
				action: ACTIONS.SYNC_USER,
				userId,
				courses: [course],
			};
			sendMessage(message);
		});
	}
};

// SCHOOL
const requestRemovalOfRemovedRooms = async (schoolId, schoolSync = false) => {
	const courses = await app.service('courses').find({ query: { schoolId } });
	const archivedCourses = courses.data.filter((course) => course.isArchived);
	archivedCourses.forEach((course) => requestCourseRemoval(course, schoolSync));
};

const requestFullSchoolSync = (school) => {
	const message = {
		action: ACTIONS.SYNC_SCHOOL,
		schoolId: school._id,
		fullSync: true,
	};
	sendMessage(message);
};

const requestSyncForEachSchoolUser = async (schoolId, schoolSync = false) => {
	const users = await app.service('users').find({ query: { schoolId } });
	users.data.forEach((user) => requestFullSyncForUser(user, schoolSync));
};

// SETUP
const setup = (app_) => {
	app = app_;
	channelSendInternal = getChannel(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), { durable: true });
};

module.exports = {
	setup,
	ACTIONS,

	// USER
	requestFullSyncForUser,
	requestUserRemoval,

	// TEAM
	requestTeamSync,
	requestSyncForEachTeamUser,
	requestTeamRemoval,

	// COURSE
	requestCourseSync,
	requestSyncForEachCourseUser,
	requestCourseRemoval,

	// SCHOOL
	requestFullSchoolSync,
	requestSyncForEachSchoolUser,
	requestRemovalOfRemovedRooms,
};
