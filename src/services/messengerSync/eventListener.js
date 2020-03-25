const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');

let channel;

const handleCourseChanged = async (course, app) => {
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

const setup = async (app) => {
	channel = await createChannel();
	app.service('teams').on('created', handleTeamChanged);
	app.service('teams').on('patched', handleTeamChanged);
	app.service('teams').on('updated', handleTeamChanged);
	app.service('courses').on('created', (context) => handleCourseChanged(context, app));
	app.service('courses').on('patched', (context) => handleCourseChanged(context, app));
	app.service('courses').on('updated', (context) => handleCourseChanged(context, app));
};

module.exports = setup;
