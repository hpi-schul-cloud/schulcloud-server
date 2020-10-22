const service = require('feathers-mongoose');
const { authenticate } = require('@feathersjs/authentication');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const OAuth = require('oauth-1.0a');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const ltiTool = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	app.use('/ltiTools/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

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

	app.use('/tools/:id/link', {
		create(data, params) {
			return app
				.service('ltiTools')
				.find({
					query: {
						oAuthClientId: jwt.decode(data.id_token).iss,
						lti_version: '1.3.0',
						isTemplate: true,
					},
				})
				.then((tool) => {
					const idToken = jwt.verify(data.id_token, tool.data[0].key, { algorithm: 'RS256' });
					const link = idToken['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'];
					return `<html>
	<head>
		<script>
			window.parent.postMessage({id: '${params.route.id}', url: '${link.url}'}, '${app.Config.data.HOST}');
		</script>
	</head>
	<body>
		<h1>Speichern...</h1>
	</body>
</html>`;
				});
		},
	});
	app.service('/tools/:id/link').hooks({
		after: {
			create: (context) => {
				context.data.headerPipes = [{ key: 'content-type', value: 'text/html' }];
				return context;
			},
		},
	});

	app.use('/tools/sign/lti11/', {
		create(data) {
			return app
				.service('/ltiTools')
				.get(data.id)
				.then((tool) => {
					const consumer = OAuth({
						consumer: {
							key: tool.key,
							secret: tool.secret,
						},
						signature_method: 'HMAC-SHA1',
						hash_function: (baseString, key) => CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64),
					});
					const requestData = {
						url: data.url,
						method: 'POST',
						data: data.payload,
					};
					return consumer.authorize(requestData);
				});
		},
	});
	app.service('/tools/sign/lti11/').hooks({
		before: {
			create: [authenticate('jwt')],
		},
	});

	app.use('/tools/sign/lti13', {
		create(data) {
			data.request.name = decodeURI(data.request.name);
			return Promise.resolve(jwt.sign(data.request, fs.readFileSync('private_key.pem'), { algorithm: 'RS256' }));
		},
	});
	app.service('/tools/sign/lti13/').hooks({
		before: {
			create: [authenticate('jwt')],
		},
	});
};
