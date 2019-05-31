const socketio = require('@feathersjs/socketio');
const clipboard = require('./clipboard');

module.exports = function setup() {
	const app = this;
	const configSocketIo = socketio((io) => {
		io.use((socket, next) => {
			app.passport.authenticate('jwt')(socket.handshake)
				.then((payload) => {
					socket.client.userId = payload.data.account.userId;
					next();
				})
				.catch(() => {
					next(new Error('Authentication error'));
				});
		});
	});

	// configure your socket here
	// make use of a namespace io.of('<namespace>') and connect it as <url>/<namespace>;
	app.configure(clipboard);

	app.configure(configSocketIo);
};
