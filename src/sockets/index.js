'use strict';

const socketio = require('feathers-socketio');
const clipboard = require('./clipboard');

module.exports = function () {
	const app = this;

	//configure your socket here
	//make use of a namespace io.of('<namespace>') and connect it as <url>/<namespace>;
	app.configure(clipboard);

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
