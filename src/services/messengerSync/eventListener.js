const { createChannel } = require('../../utils/rabbitmq');

let channel;
const internalQueue = 'matrix_sync_unpopulated';

const handleCourseChanged = async (course, app) => {
	console.log('handleCourseChanged');
	const users = course.userIds.concat(course.teacherIds).concat(course.substitutionIds);
	channel.assertQueue(internalQueue, {
		durable: false,
	});
	users.foreach((userId) => {
		const message = JSON.stringify({ userId, course });
		channel.sendToQueue(internalQueue, Buffer.from(message));
	});
};

const setup = async (app) => {
	channel = await createChannel();
	app.service('courses').on('created', (context) => handleCourseChanged(context, app));
	app.service('courses').on('patched', (context) => handleCourseChanged(context, app));
	app.service('courses').on('updated', (context) => handleCourseChanged(context, app));
};

module.exports = setup;
