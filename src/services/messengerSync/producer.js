const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');

let app;
let channel;

const sendToQueue = (message) => {
	const msgJson = JSON.stringify(message);
	const msgBuffer = Buffer.from(msgJson);
	channel.sendToQueue(QUEUE_INTERNAL, msgBuffer, { persistent: true });
};

const requestFullSchoolSync = (school) => {
	const message = {
		action: 'syncSchool',
		schoolId: school._id,
		fullSync: true,
	};
	sendToQueue(message);
};

const requestSyncForEachCourseUser = async (course) => {
	const users = course.userIds.concat(course.teacherIds).concat(course.substitutionIds);

	users.forEach((userId) => {
		const message = {
			action: 'syncUser',
			userId,
			courses: [course],
		};
		sendToQueue(message);
	});
};

const requestSyncForEachTeamUser = async (team) => {
	const users = team.userIds.map((teamUser) => teamUser.userId);

	users.forEach((userId) => {
		const message = {
			action: 'syncUser',
			userId,
			teams: [team],
		};
		sendToQueue(message);
	});
};

const requestFullSyncForUser = async (user) => {
	const message = {
		action: 'syncUser',
		userId: user._id,
		fullSync: true,
	};
	sendToQueue(message);
};

const requestSyncForEachSchoolUser = async (schoolId) => {
	const users = await app.service('users').find({ query: { schoolId } });
	users.data.forEach((user) => requestFullSyncForUser(user));
};

const setup = async (app_) => {
	app = app_;
	channel = await createChannel();

	await Promise.all([
		channel.assertQueue(QUEUE_INTERNAL, { durable: true }),
	]);
};

module.exports = {
	setup,
	requestFullSchoolSync,
	requestFullSyncForUser,
	requestSyncForEachSchoolUser,
	requestSyncForEachCourseUser,
	requestSyncForEachTeamUser,
};
