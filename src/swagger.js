const feathersSwagger = require('feathers-swagger');
const serveStatic = require('feathers').static;
const path = require('path');

module.exports = function (app) {
	app.configure(feathersSwagger({
		/* example configuration */
		docsPath: '/docs',
		version: '0.0.1',
		basePath: '',
		uiIndex: path.join(__dirname, 'swagger.html'),
		info: {
			'title': 'Schul-Cloud API',
			'description': 'This is the Schul-Cloud API.',
			'termsOfServiceUrl': 'https://github.com/schulcloud/schulcloud-server/blob/master/LICENSE',
			'contact': 'team@schul.tech',
			'license': 'GPL-3.0',
			'licenseUrl': 'https://github.com/schulcloud/schulcloud-server/blob/master/LICENSE'
		}
	}));
};
