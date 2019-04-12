/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
const assert = require('assert');
const chai = require('chai');
const mockery = require('mockery');
const app = require('../../../src/app');
const rcMockServer = require('./rocketChatMockServer');


const rocketChatLoginService = app.service('/rocketChat/login');
const rocketChatLogoutService = app.service('rocketChat/logout');
const rocketChatChannelService = app.service('/rocketChat/channel');

const { expect } = chai;

describe('rocket.chat user service', () => {
	let server;
	let rocketChatUserService;

	before(async () => {
		const rcMock = await rcMockServer({});
		mockery.enable({
			warnOnUnregistered: false,
		});

		// ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID
		mockery.registerMock('./rocketChatConfig', { ROCKET_CHAT_URI: rcMock.url });

		delete require.cache[require.resolve('../../../src/services/rocketChat/index.js')];

		app.configure(require('../../../src/services/rocketChat'));
		rocketChatUserService = app.service('/rocketChat/user');

		server = app.listen(0);
		return server;
	});

	after((done) => {
		server.close(done);
	});

	it('registered the RC user service', () => {
		assert.ok(rocketChatUserService);
	});

	it('creates a rc user for a sc user', () => rocketChatUserService.get('0000d231816abba584714c9e').then((rcUser) => {
		expect(rcUser.rcId).to.exist;
		expect(rcUser.username).to.exist;
		expect(rcUser.password).not.to.exist;
	}));

	it('retrieves existing rc users instead of creating new', async () => {
		const firstResult = await rocketChatUserService.get('0000d231816abba584714c9e');
		const secondResult = await rocketChatUserService.get('0000d231816abba584714c9e');
		expect(firstResult.username).to.equal(secondResult.username);
		expect(firstResult.rcId).to.equal(secondResult.rcId);
	});

	it('recovers if email is already used in rc', async () => {
		const rcModels = require('../../../src/services/rocketChat/model');
		const user = await rocketChatUserService.get('0000d231816abba584714c9e');
		await rcModels.userModel.remove(user._id); // break something
		const newUser = await rocketChatUserService.get('0000d231816abba584714c9e');
		expect(newUser.rcId).to.exist;
		expect(newUser.username).to.exist;
		expect(newUser.rcId).to.equal(user.rcId);
		expect(newUser.username).to.equal(user.username);
	});
});

describe('rocket.chat login service', () => {
	it('registered the RC login service', () => {
		assert.ok(rocketChatLoginService);
	});
});

describe('rocket.chat logout service', () => {
	it('registered the RC logout service', () => {
		assert.ok(rocketChatLogoutService);
	});
});

describe('rocket.chat channel service', () => {
	it('registered the RC channel service', () => {
		assert.ok(rocketChatChannelService);
	});
});
