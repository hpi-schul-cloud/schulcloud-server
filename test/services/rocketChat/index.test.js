/* eslint-disable no-unused-expressions */
const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

const rocketChatUserService = app.service('/rocketChat/user');
const rocketChatLoginService = app.service('/rocketChat/login');
const rocketChatLogoutService = app.service('rocketChat/logout');
const rocketChatChannelService = app.service('/rocketChat/channel');

//const { expect } = chai;

describe('rocket.chat user service', () => {
	it('registered the RC user service', () => {
		assert.ok(rocketChatUserService);
	});

	it('creates a rc user for a sc user');
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
