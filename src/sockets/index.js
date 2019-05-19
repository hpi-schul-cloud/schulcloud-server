const socketio = require('@feathersjs/socketio');
const clipboard = require('./clipboard');

module.exports = function () {
	const app = this;

	app.configure(socketio());

};
