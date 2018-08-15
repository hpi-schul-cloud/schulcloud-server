'use strict';

const socketio = require('feathers-socketio');
const jwtDecode = require('jwt-decode');

module.exports = function () {
	const app = this;

	app.configure(socketio(io => {
		io.on('connection', (socket) => {

			let releasePromise = app.service('releases').find({query: {$sort: '-createdAt'}});
			let userPromise = app.service('users').get(socket.client.userId);

			return Promise.all([userPromise, releasePromise])
				.then((result) => {
					let user = result[0];
					let release = result[1].data[0];
					let prefs = user.preferences || {};
					if(!release) Promise.resolve();

					if (Date.parse(prefs.releaseDate) < Date.parse(release.createdAt)) {
						socket.emit('newReleaseAvailable', {bool: true, createdAt: release.createdAt});
					} else if (typeof prefs.releaseDate == 'undefined')
						socket.emit('newReleaseAvailable', {bool: true, createdAt: release.createdAt});

					return Promise.resolve();
				});
			});
	}));
};
