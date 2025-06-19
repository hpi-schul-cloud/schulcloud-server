const service = require('../../utils/feathers-mongoose');
const axios = require('axios');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const release = require('./release-model');
const hooks = require('./hooks/index');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');

class ReleaseFetchService {
	async find() {
		const options = {
			method: 'get',
			url: Configuration.get('RELEASE_NOTES_REPO_URL'),
		};

		let releases = null;
		try {
			const res = await axios(options);
			releases = res.data;
			await release.deleteMany({});
			for (const r of releases) {
				await release.create({
					_id: r.id,
					name: r.name,
					body: r.body,
					url: r.html_url,
					author: r.author.login,
					authorUrl: r.author.html_url,
					createdAt: r.created_at,
					publishedAt: r.published_at,
					zipUrl: r.zipball_url,
				});
			}
		} catch (error) {
			throw new Error(error);
		}
		return releases;
	}
}

module.exports = function relases() {
	const app = this;

	const options = {
		Model: release,
		paginate: {
			default: 10000,
			max: 10000,
		},
		lean: true,
	};

	app.use('/releases/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/releases/fetch', new ReleaseFetchService());
	app.use('/releases', service(options));

	const releaseFetchService = app.service('/releases/fetch');
	const releaseService = app.service('/releases');

	releaseService.hooks(hooks);
	releaseFetchService.hooks(hooks);
};
