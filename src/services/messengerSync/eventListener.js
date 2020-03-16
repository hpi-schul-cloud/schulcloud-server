const { createChannel } = require('../../utils/rabbitmq');

let channel;
const internalQueue = 'matrix_sync_unpopulated';

const handleCourseChanged = async (course, app) => {
	const users = course.userIds.concat(course.teacherIds).concat(course.substitutionIds);
	channel.assertQueue(internalQueue, {
		durable: false,
	});
	users.forEach((userId) => {
		const message = JSON.stringify({ userId, course });
		channel.sendToQueue(internalQueue, Buffer.from(message), { persistent: true });
	});
};

const setup = async (app) => {
	channel = await createChannel();
	app.service('courses').on('created', (context) => handleCourseChanged(context, app));
	app.service('courses').on('patched', (context) => handleCourseChanged(context, app));
	app.service('courses').on('updated', (context) => handleCourseChanged(context, app));
};

module.exports = setup;
