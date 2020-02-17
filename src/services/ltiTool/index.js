const service = require('feathers-mongoose');
const CryptoJS = require('crypto-js');
const OAuth = require('oauth-1.0a');

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

	app.use('/tools/sign/lti11/', {
		create(data) {
			return app.service('/ltiTools')
				.get(data.id)
				.then((tool) => {
					const consumer = OAuth({
						consumer: {
							key: tool.key,
							secret: tool.secret,
						},
						signature_method: 'HMAC-SHA1',
						hash_function: (baseString, key) => CryptoJS.HmacSHA1(baseString, key)
							.toString(CryptoJS.enc.Base64),
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
};
