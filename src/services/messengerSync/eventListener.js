const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');

let channel;
const internalQueue = 'matrix_sync_unpopulated';

const handleCourseChanged = async (course, app) => {
	const users = course.userIds.concat(course.teacherIds).concat(course.substitutionIds);
	channel.assertQueue(internalQueue, {
		durable: true,
	});
	users.forEach((userId) => {
		const message = JSON.stringify({ userId, courses: [course] });
		channel.sendToQueue(internalQueue, Buffer.from(message), { persistent: true });
	});
};

const handleTeamChanged = (team) => {
	if (team.users) {
		const users = team.userIds.map((teamUser) => teamUser.userId);
		channel.assertQueue(internalQueue, {
			durable: true,
		});
		users.forEach((userId) => {
			const message = JSON.stringify({ userId, teams: [team] });
			channel.sendToQueue(internalQueue, Buffer.from(message), { persistent: true });
		});
	}
};

const setup = async (app) => {
	if (Configuration.get('FEATURE_RABBITMQ_ENABLED')) {
		channel = await createChannel();
		app.service('teams').on('created', handleTeamChanged);
		app.service('teams').on('patched', handleTeamChanged);
		app.service('teams').on('updated', handleTeamChanged);
		app.service('courses').on('created', (context) => handleCourseChanged(context, app));
		app.service('courses').on('patched', (context) => handleCourseChanged(context, app));
		app.service('courses').on('updated', (context) => handleCourseChanged(context, app));
	}
};

module.exports = setup;
