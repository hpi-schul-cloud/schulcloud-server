const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const logger = require('../../logger');
const { ROCKET_CHAT_URI, ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID } = require('../../../config/globals');
const { rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks } = require('./hooks');

const RocketChatUser = require('./services/rocketChatUser');
const RocketChatLogin = require('./services/rocketChatLogin');
const RocketChatLogout = require('./services/rocketChatLogout');
const RocketChatChannel = require('./services/rocketChatChannel');

if (ROCKET_CHAT_URI === undefined) {
	logger.warning('please set the environment variable ROCKET_CHAT_URI');
}
if (ROCKET_CHAT_ADMIN_TOKEN === undefined) {
	logger.warning('please set the environment variable ROCKET_CHAT_ADMIN_TOKEN');
}
if (ROCKET_CHAT_ADMIN_ID === undefined) {
	logger.warning('please set the environment variable ROCKET_CHAT_ADMIN_ID');
}

module.exports = function Setup() {
	const app = this;

	app.use('/rocketChat/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/rocketChat/channel', new RocketChatChannel());
	app.use('/rocketChat/user', new RocketChatUser());
	app.use('/rocketChat/login', new RocketChatLogin());
	app.use('/rocketChat/logout', new RocketChatLogout());

	const rocketChatUserService = app.service('/rocketChat/user');
	const rocketChatLoginService = app.service('/rocketChat/login');
	const rocketChatLogoutService = app.service('rocketChat/logout');
	const rocketChatChannelService = app.service('/rocketChat/channel');

	rocketChatUserService.hooks(rocketChatUserHooks);
	rocketChatLoginService.hooks(rocketChatLoginHooks);
	rocketChatLogoutService.hooks(rocketChatLogoutHooks);
	rocketChatChannelService.hooks(rocketChatChannelHooks);
};
