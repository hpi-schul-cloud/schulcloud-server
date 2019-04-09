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

	before(async () => {
		const rcMock = await rcMockServer({});
		mockery.enable({
			warnOnUnregistered: false,
		});

		// ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID
		mockery.registerMock('./rocketChatConfig', { ROCKET_CHAT_URI: rcMock.url });

		delete require.cache[require.resolve('../../../src/services/rocketChat/index.js')];

		app.configure(require('../../../src/services/rocketChat'));

		server = app.listen(0);
		return server;
	});

	after((done) => {
		server.close(done);
	});

	it('registered the RC user service', () => {
		const rocketChatUserService = app.service('/rocketChat/user');
		assert.ok(rocketChatUserService);
	});

	it('creates a rc user for a sc user', () => {
		const rocketChatUserService = app.service('/rocketChat/user');

		return rocketChatUserService.get('0000d231816abba584714c9e').then((rcUser) => {
			expect(rcUser.rcId).to.exist;
			expect(rcUser.username).to.exist;
			expect(rcUser.password).not.to.exist;
		});
	});
});

describe('rocket.chat login service', () => {
	it('registered the RC user service', () => {
		assert.ok(rocketChatLoginService);
	});
});

describe('rocket.chat logout service', () => {
	it('registered the RC user service', () => {
		assert.ok(rocketChatLogoutService);
	});
});

describe('rocket.chat user service', () => {
	it('registered the RC user service', () => {
		assert.ok(rocketChatChannelService);
	});
});
