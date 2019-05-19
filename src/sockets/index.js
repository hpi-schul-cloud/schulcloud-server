const socketio = require('@feathersjs/socketio');

module.exports = function sockets() {
	const app = this;
	app.configure(socketio());
};
