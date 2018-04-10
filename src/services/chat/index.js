'use strict';
const RChatStrategy = require('./strategies/rocketchat');
const CourseModel = require('../user-group/model').courseModel;
const ClassModel = require('../user-group/model').classModel;
const errors = require('feathers-errors');

const strategies = {
	rChat: RChatStrategy
};

const createCorrectStrategy = (chatType) => {
	const strategy = strategies[chatType];
	if (!strategy) throw new errors.BadRequest("No chat provided for this school");
	return new strategy();
};

class ChatService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {

	}

	find(params) {

	}

	remove(id, params) {

	}

	update(id, data, params) {

	}

	setup(app, path) {
		this.app = app;
	}
}

class ChannelChatService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {

	}

	find(params) {

	}

	remove(id, params) {

	}

	update(id, data, params) {

	}

	setup(app, path) {
		this.app = app;
	}
}

class GroupChatService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		let chatType = data.chatType;
		data.chatType = undefined;

		if (data.type == 'course') {
			return CourseModel.find({ query: { _id: data._id, $populate: ['teacherIds', 'substitutionIds', 'userIds'] }}).exec()
				.then(course => {
					let members = [];
					course.data[0].teacherIds.forEach((ele) => {
						members.push(ele.chatId);
					});
					course.data[0].substitutionIds.forEach((ele) => {
						members.push(ele.chatId);
					});
					course.data[0].userIds.forEach((ele) => {
						members.push(ele.chatId);
					});

					data.type = undefined;
					data._id = undefined;

					data.members = members;

					return createCorrectStrategy(chatType.type).createGroup(chatType.url, data)
						.then(res => {
							return res;
						});
				});
		} else {
			return ClassModel.find({ query: { _id: data._id, $populate: ['teacherIds', 'userIds'] }}).exec()
				.then(classRes => {
					let members = [];
					classRes.data[0].teacherIds.forEach((ele) => {
						members.push(ele.chatId);
					});
					classRes.data[0].userIds.forEach((ele) => {
						members.push(ele.chatId);
					});

					data.type = undefined;
					data._id = undefined;

					data.members = members;

					return createCorrectStrategy(chatType.type).createGroup(chatType.url, data)
						.then(res => {
							return res;
						});
				});
		}
	}

	find(params) {

	}

	remove(id, params) {

	}

	update(id, data, params) {

	}

	setup(app, path) {
		this.app = app;
	}
}

class UserChatService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		let chatType = data.chatType;
		data.chatType = undefined;

		return createCorrectStrategy(chatType.type).createUser(chatType.url, data)
			.then(res => {
				return res;
			});
	}

	find(params) {

	}

	remove(id, params) {

	}

	update(id, data, params) {

	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/chat/channel', new ChannelChatService());
	app.use('/chat/group', new GroupChatService());
	app.use('/chat/user', new UserChatService());
	app.use('/chat', new ChatService());

	// Get our initialize service to that we can bind hooks
	const chatService = app.service('/chat');
	const userChatService = app.service('/chat/user');
	const groupChatService = app.service('/chat/group');
	const channelChatService = app.service('/chat/channel');

	// Set up our before hooks
	//chatService.before(hooks.before);

	// Set up our after hooks
	//chatService.after(hooks.after);
};
