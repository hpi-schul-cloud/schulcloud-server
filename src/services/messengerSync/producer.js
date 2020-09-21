const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { getAllCourseUserIds } = require('../user-group/logic/courses');
const { teamsModel } = require('../teams/model');

const ACTIONS = {
	SYNC_USER: 'syncUser',
	SYNC_SCHOOL: 'syncSchool',
};

let app;
let channel;

const sendToQueue = (message) => {
	const msgJson = JSON.stringify(message);
	const msgBuffer = Buffer.from(msgJson);
	channel.sendToQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), msgBuffer, { persistent: true });
};

const requestFullSchoolSync = (school) => {
	const message = {
		action: ACTIONS.SYNC_SCHOOL,
		schoolId: school._id,
		fullSync: true,
	};
	sendToQueue(message);
};

const requestSyncForEachCourseUser = async (course) => {
	getAllCourseUserIds(course).forEach((userId) => {
		const message = {
			action: ACTIONS.SYNC_USER,
			userId,
			courses: [course],
		};
		sendToQueue(message);
	});
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
		sendToQueue(message);
	});
};

const requestFullSyncForUser = async (user) => {
	const message = {
		action: ACTIONS.SYNC_USER,
		userId: user._id,
		fullSync: true,
	};
	sendToQueue(message);
};

const requestSyncForEachSchoolUser = async (schoolId) => {
	const users = await app.service('users').find({ query: { schoolId } });
	users.data.forEach((user) => requestFullSyncForUser(user));
};

const setup = (app_) => {
	app = app_;
	return createChannel()
		.then((createdChannel) => {
			channel = createdChannel;
			return channel.assertQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), { durable: true });
		});
};

module.exports = {
	setup,
	ACTIONS,
	requestFullSchoolSync,
	requestFullSyncForUser,
	requestSyncForEachSchoolUser,
	requestSyncForEachCourseUser,
	requestSyncForEachTeamUser,
};
