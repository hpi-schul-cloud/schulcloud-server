'use strict';

const socketio = require('@feathersjs/socketio');
const jwtDecode = require('jwt-decode');
const compress = require('compression');

module.exports = function () {
	const app = this;

	app.use(compress()).configure(socketio(io => {
		io.on('connection', (socket) => {
			let cookies = [];
			try {
				cookies = socket.handshake.headers.cookie.split(';');
			}catch(e) {
				return;
			}
			let jwt = '';
			cookies.map(cookie => {
				if (cookie.includes('jwt')) {
					jwt = cookie.split('=')[1];
				}
			});
			let jwtDecoded = {};
			if (jwt)
				jwtDecoded = jwtDecode(jwt);
			else
				return;

			let releasePromise = app.service('releases').find({query: {$sort: '-createdAt'}});
			let userPromise = app.service('users').get(jwtDecoded.userId);

			return Promise.all([userPromise, releasePromise])
				.then((result) => {
					let user = result[0];
					let release = result[1].data[0];
					let prefs = user.preferences || {};

					if (Date.parse(prefs.releaseDate) < Date.parse(release.createdAt)) {
						socket.emit('newReleaseAvailable', {bool: true, createdAt: release.createdAt});
					} else if (typeof prefs.releaseDate == 'undefined')
						socket.emit('newReleaseAvailable', {bool: true, createdAt: release.createdAt});

					return Promise.resolve();
				});
			});
	}));
};
