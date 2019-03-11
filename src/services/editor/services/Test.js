/* eslint-disable no-param-reassign */
const { userModel } = require('../../user/model');
const CustomJWTService = require('../../account/CustomJWTService');
const logger = require('../../../logger/');

class Test {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find() {
		const { authentication } = this.app.get('secrets');
		if (authentication === undefined) {
			logger.warn('No secrets authentication defined.');
		}
		const jwtService = new CustomJWTService(authentication);
		const [user1, user2] = await userModel.find({}).limit(2).exec();
		const fakeData = { users: [user2.id] };
		const fakeParams = { account: { userId: user1.id } };
		const jwt = await jwtService.create({ userId: user1.id });
		return this.app.service('/editor/lessons').create(fakeData, fakeParams).then((lesson) => {
			lesson.jwt = jwt;
			return lesson;
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Test;
