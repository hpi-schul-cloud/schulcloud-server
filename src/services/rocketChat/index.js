const { Configuration } = require('@schul-cloud/commons');
const { rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks } = require('./hooks');

const RocketChatUser = require('./services/rocketChatUser');
const RocketChatLogin = require('./services/rocketChatLogin');
const RocketChatLogout = require('./services/rocketChatLogout');
const RocketChatChannel = require('./services/rocketChatChannel');


module.exports = function Setup() {
	const app = this;

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
