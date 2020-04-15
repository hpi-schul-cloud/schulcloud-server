const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');

let channel;

const handleCourseChanged = async (course) => {
	const users = course.userIds.concat(course.teacherIds).concat(course.substitutionIds);
	await channel.assertQueue(QUEUE_INTERNAL, {
		durable: true,
	});
	users.forEach((userId) => {
		const message = JSON.stringify({ userId, courses: [course] });
		channel.sendToQueue(QUEUE_INTERNAL, Buffer.from(message), { persistent: true });
	});
};

const handleTeamChanged = async (team) => {
	if (team.users) {
		const users = team.userIds.map((teamUser) => teamUser.userId);
		await channel.assertQueue(QUEUE_INTERNAL, {
			durable: true,
		});
		users.forEach((userId) => {
			const message = JSON.stringify({ userId, teams: [team] });
			channel.sendToQueue(QUEUE_INTERNAL, Buffer.from(message), { persistent: true });
		});
	}
};

const handleUserCreated = async (user) => {
	await channel.assertQueue(QUEUE_INTERNAL, {
		durable: true,
	});
	const message = JSON.stringify({ userId: user._id, fullSync: true });
	channel.sendToQueue(QUEUE_INTERNAL, Buffer.from(message), { persistent: true });
};

const handleUserRemoved = async () => {
	// TODO
};

const setup = async (app) => {
	channel = await createChannel();

	// teams
	app.service('teams').on('created', handleTeamChanged);
	app.service('teams').on('patched', handleTeamChanged);
	app.service('teams').on('updated', handleTeamChanged);

	// courses
	app.service('courses').on('created', handleCourseChanged);
	app.service('courses').on('patched', handleCourseChanged);
	app.service('courses').on('updated', handleCourseChanged);

	// users
	app.service('users').on('created', handleUserCreated);
	app.service('users').on('removed', handleUserRemoved);
};

module.exports = setup;
