const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const logger = require('../../logger');
const { rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks } = require('./hooks');

const RocketChatUser = require('./services/rocketChatUser');
const RocketChatLogin = require('./services/rocketChatLogin');
const RocketChatLogout = require('./services/rocketChatLogout');
const RocketChatChannel = require('./services/rocketChatChannel');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');

if (!Configuration.has('ROCKET_CHAT_URI')) {
	logger.warning('please set the environment variable ROCKET_CHAT_URI');
}
if (!Configuration.has('ROCKET_CHAT_ADMIN_TOKEN')) {
	logger.warning('please set the environment variable ROCKET_CHAT_ADMIN_TOKEN');
}
if (!Configuration.has('ROCKET_CHAT_ADMIN_ID')) {
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
