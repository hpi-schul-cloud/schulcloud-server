'use strict';

const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const feathersSwagger = require('feathers-swagger');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const socketio = require('feathers-socketio');
const middleware = require('./middleware');
const services = require('./services');
const setupEnvironment = require('./setupEnvironment');
const winston = require('winston');
const defaultHeaders = require('./middleware/defaultHeaders');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app.configure(feathersSwagger({
	/* example configuration */
	docsPath:'/docs',
	version: '0.0.1',
	basePath: '/api',
	info: {
			'title': 'API',
			'description': 'This is the Schul-Cloud API.',
			'termsOfServiceUrl': 'https://github.com/schulcloud/schulcloud-server/blob/master/LICENSE',
			'contact': 'team@schul.tech',
			'license': 'GPL-3.0',
			'licenseUrl': 'https://github.com/schulcloud/schulcloud-server/blob/master/LICENSE'
	}
}));

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', serveStatic(app.get('public')))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({extended: true}))
	.use(defaultHeaders)
	.use('/swagger-ui', serveStatic(__dirname + '/node_modules/swagger-ui/dist'))
	.configure(hooks())
	.configure(rest())
	.configure(socketio())
	.configure(services)
	.configure(middleware);

winston.cli();	// optimize for cli, like using colors
winston.level = 'debug';
winston.info('test');
setupEnvironment(app);


module.exports = app;
