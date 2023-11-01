/* eslint-disable max-classes-per-file */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
const assert = require('assert');
const chai = require('chai');
const mockery = require('mockery');
const { ObjectId } = require('mongoose').Types;

const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const testObjects = require('../helpers/testObjects')(appPromise());

const { expect } = chai;

describe('rocket.chat user service', () => {
	delete require.cache[require.resolve('../../../src/app')];

	let app;
	let server;
	let nestServices;
	let rocketChatUserService;

	before(async () => {
		app = await appPromise();
		// const rcMock = await rcMockServer({});
		const rocketChatService = {
			getUserList: () => ({ users: [{ _id: 'someId', username: 'someUsername' }] }),
		};
		mockery.enable({
			warnOnUnregistered: false,
		});

		// ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID
		// mockery.registerMock('../../../config/globals', { ROCKET_CHAT_URI: rcMock.url });
		// const rocketChatService = { getUserList: sinon.spy() };
		app.services['nest-rocket-chat'] = rocketChatService;

		delete require.cache[require.resolve('../../../src/services/rocketChat/services/rocketChatUser.js')];
		delete require.cache[require.resolve('../../../src/services/rocketChat/helpers.js')];
		delete require.cache[require.resolve('../../../src/services/rocketChat/index.js')];
		const rocketChat = require('../../../src/services/rocketChat');
		app = await appPromise();
		app.configure(rocketChat);
		rocketChatUserService = app.service('/rocketChat/user');

		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		return server;
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	it('registered the RC user service', () => {
		assert.ok(rocketChatUserService);
	});

	it('creates a rc user for a sc user', async () => {
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId: '5f2987e020834114b8efd6f8' });
		const rcUser = await rocketChatUserService.get(user._id);
		expect(rcUser.rcId).to.exist;
		expect(rcUser.username).to.exist;
		expect(rcUser.password).not.to.exist;
	});

	it('retrieves existing rc users instead of creating new', async () => {
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId: '5f2987e020834114b8efd6f8' });
		const firstResult = await rocketChatUserService.get(user._id);
		const secondResult = await rocketChatUserService.get(user._id);
		expect(firstResult.username).to.equal(secondResult.username);
		expect(firstResult.rcId).to.equal(secondResult.rcId);
	});

	it('recovers if email is already used in rc', async () => {
		const rcModels = require('../../../src/services/rocketChat/model');
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId: '5f2987e020834114b8efd6f8' });
		const rcUser = await rocketChatUserService.get(user._id);
		await rcModels.userModel.remove(rcUser._id); // break something
		const newUser = await rocketChatUserService.get(user._id);
		expect(newUser.rcId).to.exist;
		expect(newUser.username).to.exist;
		expect(newUser.rcId).to.equal(rcUser.rcId);
		expect(newUser.username).to.equal(rcUser.username);
	});
});

// service.logoutUser(rcUser.authToken, rcUser.rcId);
class NestRocketChatServiceMock {
	setup(app) {
		this.app = app;
	}

	async logoutUser(authToken, rcId) {
		return { authToken, rcId };
	}

	async me() {
		return {
			success: true,
		};
	}

	createUserToken() {
		return {
			data: {
				authToken: 'Test_Token',
			},
			success: true,
		};
	}

	async setUserStatus(returns) {
		return (
			returns || {
				success: true,
			}
		);
	}
}

//  this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params);
class RocketChatUserServiceMock {
	setup(app) {
		this.app = app;
	}

	constructor(mockFunction) {
		if (mockFunction) {
			this.getOrCreateRocketChatAccount = mockFunction;
		}
	}

	async getOrCreateRocketChatAccount(userId, params) {
		const rocktChatUserData = {
			authToken: 'rocketChatToken123',
			username: 'rocktChatUserABC',
			rcId: new ObjectId(userId),
		};

		return rocktChatUserData;
	}
}

describe('rocket.chat login service', async () => {
	delete require.cache[require.resolve('../../../src/app')];
	let app;
	let rocketChatLoginService;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		rocketChatLoginService = app.service('/rocketChat/login');
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	const setupServices = async (RCNestMock, RCUserMock) => {
		app.use('/nest-rocket-chat', RCNestMock || new NestRocketChatServiceMock());
		app.use('/rocketChat/user', RCUserMock || new RocketChatUserServiceMock());
		const setupData = await testObjects.setupUser();
		return setupData;
	};

	it('registered the RC login service', () => {
		assert.ok(rocketChatLoginService);
	});

	it('Should return { authToken: "rocketChatToken123" }', async () => {
		const { requestParams, userId } = await setupServices();
		const response = await rocketChatLoginService.get(userId, requestParams);

		expect(response).to.deep.equal({ authToken: 'rocketChatToken123' });
	});

	it('Should return new tocken after call createUserToken() { authToken: "Test_Token" }', async () => {
		const { requestParams, userId } = await setupServices(
			undefined,
			new RocketChatUserServiceMock(() => {
				const rocktChatUserData = {
					authToken: '',
					username: 'rocktChatUserABC',
					rcId: new ObjectId(userId),
				};

				return rocktChatUserData;
			})
		);

		const response = await rocketChatLoginService.get(userId, requestParams);

		expect(response).to.deep.equal({ authToken: 'Test_Token' });
	});

	it('Should throw error "Can not create token."', async () => {
		const { requestParams, userId } = await setupServices(
			undefined,
			new RocketChatUserServiceMock(() => {
				throw new Error();
			})
		);

		await expect(rocketChatLoginService.get(userId, requestParams)).to.be.rejectedWith(Error, 'Can not create token.');
	});
});

describe('rocket.chat logout service', async () => {
	delete require.cache[require.resolve('../../../src/app')];
	let app;
	let rocketChatLogoutService;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		rocketChatLogoutService = app.service('rocketChat/logout');
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	const setupServices = async (RCNestMock, RCUserMock) => {
		app.use('/nest-rocket-chat', RCNestMock || new NestRocketChatServiceMock());
		app.use('/rocketChat/user', RCUserMock || new RocketChatUserServiceMock());

		const setupData = await testObjects.setupUser();

		return setupData;
	};

	it('registered the RC login service', () => {
		assert.ok(rocketChatLogoutService);
	});

	it('Should return "success"', async () => {
		const { requestParams, userId } = await setupServices();

		const response = await rocketChatLogoutService.get(userId, requestParams);

		expect(response).to.equal('success');
	});

	it('Should throw error', async () => {
		const { requestParams, userId } = await setupServices(
			undefined,
			new RocketChatUserServiceMock(() => {
				throw new Error();
			})
		);

		await expect(rocketChatLogoutService.get(userId, requestParams)).to.be.rejectedWith(
			Error,
			'could not log out user'
		);
	});
});

describe('rocket.chat channel service', async () => {
	delete require.cache[require.resolve('../../../src/app')];
	let app;
	let rocketChatChannelService;
	before(async () => {
		app = await appPromise();
		rocketChatChannelService = app.service('/rocketChat/channel');
	});
	it('registered the RC login service', () => {
		assert.ok(rocketChatChannelService);
	});
});
