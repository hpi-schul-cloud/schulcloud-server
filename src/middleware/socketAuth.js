const socketio = require('feathers-socketio');

module.exports = function () {
	const app = this;
	app.configure(socketio((io) => {
		io.use(function (socket, next) {
			let jwt = extractTokenFromCookies(socket.handshake.headers.cookie);
			app.passport.authenticate("jwt")({headers: {authorization: jwt}})
				.then((payload) => {
					socket.client.userId = payload.data.account.userId;
					next();
				})
				.catch((error) => {
					next(new Error('Authentication error'));
				});
		});
    }));

	function extractTokenFromCookies(cookies) {
		try {
			cookies = cookies.split(';');
			let jwt = undefined;
			cookies.map(cookie => {
				if (cookie.includes('jwt')) {
					jwt = cookie.split('=')[1];
				}
			});
			return jwt;
		} catch(e) {
			return undefined;
		}
	}
};
