const socketio = require('@feathersjs/socketio');

module.exports = function setup() {
	const app = this;

	// configure your socket here
	// make use of a namespace io.of('<namespace>') and connect it as <url>/<namespace>;

	app.configure(
		socketio((io) => {
			io.sockets.setMaxListeners(200);

			io.use((socket, next) => {
				app.passport
					.authenticate('jwt')(socket.handshake)
					.then((payload) => {
						socket.client.userId = payload.data.account.userId;
						next();
					})
					.catch(() => {
						next(new Error('Authentication error'));
					});
			});
		})
	);
};
