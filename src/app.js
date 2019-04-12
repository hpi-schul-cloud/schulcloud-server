const bodyParser = require('body-parser');
const compress = require('compression');
const configuration = require('feathers-configuration');
const cors = require('cors');
const favicon = require('serve-favicon');
const feathers = require('feathers');
const hooks = require('feathers-hooks');
const path = require('path');
const prettyError = require('pretty-error').start();
const rest = require('feathers-rest');
const S3rver = require('s3rver');
const serveStatic = require('feathers').static;
const socketio = require('feathers-socketio');
const winston = require('winston');
const services = require('./services');
const setupSwagger = require('./swagger');
const sockets = require('./sockets');
const middleware = require('./middleware');
const handleResponseType = require('./middleware/handleReponseType');
const defaultHeaders = require('./middleware/defaultHeaders');
const allHooks = require('./app.hooks');

require('console-stamp')(console);
require('console-stamp')(winston);

let secrets;
try {
	secrets = (['production', 'local'].includes(process.env.NODE_ENV))
		// eslint-disable-next-line global-require
		? require('../config/secrets.js')
		// eslint-disable-next-line global-require
		: require('../config/secrets.json');
} catch (error) {
	secrets = {};
}

if (!['production', 'local'].includes(process.env.NODE_ENV)) {
	new S3rver({
		port: 9001,
		hostname: 'localhost',
		silent: false,
		directory: './tmp',
	}).run((err, { address, port }) => {
		if (err) {
			console.error('failed to start local s3', err);
			return;
		}
		console.log(`local S3 is running on ${address}:${port}`);
	});
}

const app = feathers();
let config = configuration(path.join(__dirname, '..'));

app.configure(config);
setupSwagger(app);

app.set("secrets", secrets);

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', serveStatic(app.get('public')))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({extended: true}))
	.use(bodyParser.raw({type: () => true, limit: '10mb'}))

	.use(defaultHeaders)
	.get('/system_info/haproxy', (req, res) => { res.send({ "timestamp":new Date().getTime() });})
	.get('/ping', (req, res) => { res.send({ "message":"pong","timestamp":new Date().getTime() });})

	.configure(hooks())
	.configure(rest(handleResponseType))
	.configure(socketio())

	// auth is setup in /authentication/
	.configure(services)
	
	.configure(socketio())
	.configure(sockets)
	.configure(middleware)
	.hooks(allHooks);

winston.cli();	// optimize for cli, like using colors
winston.level = 'debug';

module.exports = app;
