'use strict';

const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const socketio = require('feathers-socketio');
const middleware = require('./middleware');
const services = require('./services');
const winston = require('winston');
const defaultHeaders = require('./middleware/defaultHeaders');
const setupSwagger = require('./swagger');

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));
setupSwagger(app);

// only allow a couple of endpoints to be available via REST
// so calender and notification services can access it
// to e.g. resolve tokens
const whitelistRoutes = (req, res, next) => {
	// strip leading and trialing /
	const requestPath = req.url.replace(/^\/|\/$/g, "");
	if((app.get('rest').whitelistRoutes || []).includes(requestPath)) {
		next();
	} else {
		res.status(401).send('not authorized');
	}
}

app.use(compress())
	.options('*', cors(app.get('cors')))
	.use(cors(app.get('cors')))
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', serveStatic(app.get('public')))
	.use(whitelistRoutes)
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({extended: true}))
	.use(defaultHeaders)
	.get('/system_info/haproxy', (req, res) => { res.send({ "timestamp":new Date().getTime() });})
	.get('/ping', (req, res) => { res.send({ "message":"pong","timestamp":new Date().getTime() });})
	.configure(hooks())
	.configure(rest())
	.configure(socketio((io) => {
		// allow all ports for whitelisted client hosts
		const socketCorsOrigins = (app.get('cors').origin || []).map(url => `${url}:*`);
		io.set('origins', socketCorsOrigins);
	}))
	.configure(services)
	.configure(middleware);

winston.cli();	// optimize for cli, like using colors
winston.level = 'debug';
winston.info('test');

module.exports = app;
