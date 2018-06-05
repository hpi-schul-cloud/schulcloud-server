'use strict';

const socketio = require('feathers-socketio');
const jwtDecode = require('jwt-decode');

module.exports = function () {
	const app = this;

	app.use(() => {}).configure(socketio(io => {
		io.on('connection', (socket) => {

			let cookies = socket.handshake.headers.cookie.split(';');
			let jwt = '';
			cookies.map(cookie => {
				if (cookie.includes('jwt')) {
					jwt = cookie.split('=')[1];
				}
			});
			let jwtDecoded = jwtDecode(jwt);

			let releasePromise = app.service('releases').find({query: {$sort: '-createdAt'}});
			let userPromise = app.service('users').get(jwtDecoded.userId);

			Promise.all([userPromise, releasePromise])
				.then((result) => {
					let user = result[0];
					let release = result[1].data[0];
					let prefs = user.preferences || {};

					if (Date.parse(prefs.releaseDate) < Date.parse(release.createdAt)) {
						socket.emit('releaseTrigger', {bool: true, createdAt: release.createdAt});
					} else if (typeof prefs.releaseDate == 'undefined')
						socket.emit('releaseTrigger', {bool: true, createdAt: release.createdAt});

				});
			});
	}));
};
