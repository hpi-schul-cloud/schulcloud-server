'use strict';

const service = require('feathers-mongoose');
const release = require('./release-model');
const hooks = require('./hooks/index');
const rp = require('request-promise-native');

class ReleaseFetchService {
	find({query, payload}) {
		let options = {
			uri: 'https://api.github.com/repos/schul-cloud/schulcloud-client/releases',
			headers: {
				'User-Agent': 'Request-Promise'
			},
			json: true
		};
		return rp(options)
			.then(releases => {
				return release.remove({}, function (err, result) {
					if (err) {
						return Promise.error(err);
					} else {
						return releases.map(r => {
							return release.create({
								_id: r.id,
								name: r.name,
								body: r.body,
								url: r.html_url,
								author: r.author.login,
								authorUrl: r.author.html_url,
								createdAt: r.created_at,
								publishedAt: r.published_at,
								zipUrl: r.zipball_url
							});
						});
					}
				});
			});
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: release,
		paginate: {
			default: 10000,
			max: 10000
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/releases/fetch', new ReleaseFetchService());
	app.use('/releases', service(options));

	// Get our initialize service to that we can bind hooks
	const releaseFetchService = app.service('/releases/fetch');
	const releaseService = app.service('/releases');

	// Set up our before hooks
	releaseService.before(hooks.before(releaseService));
	releaseFetchService.before(hooks.before(releaseFetchService));

	// Set up our after hooks
	releaseService.after(hooks.after);
	releaseFetchService.after(hooks.after);
};
