const feathers = require('feathers');
const path = require('path');
const auth = require('feathers-authentication');

module.exports = function init() {
	const app = this;
	app.use('/clipboard/uploads',
		auth.express.authenticate('jwt', { exposeCookies: true, exposeHeaders: true }));
	app.use('/clipboard/uploads', feathers.static(path.join(__dirname, '/../../../uploads')));
};
