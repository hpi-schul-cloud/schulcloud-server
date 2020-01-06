const service = require('feathers-mongoose');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const ltiTool = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: ltiTool,
		paginate: {
			default: 100,
			max: 100,
		},
		lean: true,
	};

	app.use('/ltiTools', service(options));
	const ltiToolService = app.service('/ltiTools');
	ltiToolService.hooks(hooks);

	app.use('/tools/sign', {
		create(data) {
			data.request.name = decodeURI(data.request.name);
			return new Promise((resolve) => resolve(
				jwt.sign(data.request, fs.readFileSync('private_key.pem'), { algorithm: 'RS256' })
			));
		},
	});

	app.use('/tools/:id/link', {
		create(data, params) {
			return app.service('ltiTools').find({
				query: {
					oAuthClientId: jwt.decode(data.id_token).iss,
					lti_version: '1.3.0',
					isTemplate: true,
				},
			}).then((tool) => {
				const idToken = jwt.verify(data.id_token, tool.data[0].key, { algorithm: 'RS256' });
				const link = idToken['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'];
				return `<!DOCTYPE><html>
	<body>
		<script>
		if(window.parent['link-${params.route.id}']) window.parent['link-${params.route.id}']('${link.url}');
		</script>
	</body>
</html>`;
			});
		},
	});
};
