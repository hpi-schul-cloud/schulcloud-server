const feathersSwagger = require('feathers-swagger');

module.exports = function swaggerSetup(app) {
	app.configure(
		feathersSwagger({
			/* example configuration */
			ui: feathersSwagger.swaggerUI({ docsPath: '/docs' }),
			basePath: '/',
			host: '',
			specs: {
				security: [{ jwtBearer: [] }],
				schemes: ['http', 'https'],
				info: {
					title: 'Schulcloud-Verbund-Software API',
					description: 'This is the Schulcloud-Verbund-Software API.',
					termsOfServiceUrl: 'https://github.com/hpi-schul-cloud/schulcloud-server/blob/master/LICENSE',
					contact: {
						name: 'support',
						email: 'info@dbildungscloud.de',
					},
					license: {
						name: 'GPL-3.0',
						url: 'https://github.com/hpi-schul-cloud/schulcloud-server/blob/master/LICENSE',
					},
					version: '0.0.1',
				},
				components: {
					securitySchemes: {
						jwtBearer: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT',
						},
					},
				},
			},
		})
	);
};
