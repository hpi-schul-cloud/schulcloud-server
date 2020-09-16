/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
const { Configuration } = require('@schul-cloud/commons');
const assert = require('assert');
const chai = require('chai');
const mockery = require('mockery');

const rcMockServer = require('./rocketChatMockServer');

const { expect } = chai;

describe('rocket.chat user service', () => {
	delete require.cache[require.resolve('../../../src/app')];

	let server;
	let rocketChatUserService;
	let app;
	let testObjects

	before(async () => {
		const rcMock = await rcMockServer({});
		mockery.enable({
			warnOnUnregistered: false,
		});

		configBefore = Configuration.toObject(); // deep copy current config
		Configuration.set('FEATURE_ROCKET_CHAT_ENABLED', true);
		Configuration.set('ROCKET_CHAT_URI', rcMock.url);
		Configuration.set('ROCKET_CHAT_ADMIN_ID', "fakeid");
		Configuration.set('ROCKET_CHAT_ADMIN_TOKEN', "supersecret");

		delete require.cache[require.resolve('../../../src/services/rocketChat/services/rocketChatUser.js')];
		delete require.cache[require.resolve('../../../src/services/rocketChat/helpers.js')];
		delete require.cache[require.resolve('../../../src/services/rocketChat/index.js')];
		app = require('../../../src/app');
		testObjects = require('../helpers/testObjects')(app);
		const rocketChat = require('../../../src/services/rocketChat');
		app.configure(rocketChat);
		rocketChatUserService = app.service('/rocketChat/user');

		server = app.listen(0);
		return server;
	});

	after((done) => {
		Configuration.reset(configBefore);
		server.close(done);
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

describe('rocket.chat login service', () => {
	delete require.cache[require.resolve('../../../src/app')];
	const app = require('../../../src/app');
	const rocketChatLoginService = app.service('/rocketChat/login');
	it('registered the RC login service', () => {
		assert.ok(rocketChatLoginService);
	});
});

describe('rocket.chat logout service', () => {
	delete require.cache[require.resolve('../../../src/app')];
	const app = require('../../../src/app');
	const rocketChatLogoutService = app.service('rocketChat/logout');
	it('registered the RC logout service', () => {
		assert.ok(rocketChatLogoutService);
	});
});

describe('rocket.chat channel service', () => {
	delete require.cache[require.resolve('../../../src/app')];
	const app = require('../../../src/app');
	const rocketChatChannelService = app.service('/rocketChat/channel');
	it('registered the RC channel service', () => {
		assert.ok(rocketChatChannelService);
	});
});
