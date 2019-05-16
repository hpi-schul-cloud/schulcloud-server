const socketio = require('@feathersjs/socketio');
const clipboard = require('./clipboard');

module.exports = function () {
	const app = this;

	//configure your socket here
	//make use of a namespace io.of('<namespace>') and connect it as <url>/<namespace>;
	app.configure(clipboard);

	app.configure(socketio());
	// TODO Find another way to get the userId in the sockets, because overwriting the authentification is no good solution
	// app.configure(socketio((io) => {
	// 	io.use(function (socket, next) {
	// 		app.passport.authenticate("jwt")(socket.handshake)
	// 			.then((payload) => {
	// 				socket.client.userId = payload.data.account.userId;
	// 				next();
	// 			})
	// 			.catch((error) => {
	// 				next(new Error('Authentication error'));
	// 			});
	// 	});
  //   }));

};
