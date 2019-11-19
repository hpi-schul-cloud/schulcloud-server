const Sentry = require('@sentry/node');
const express = require('@feathersjs/express');
const decode = require('jwt-decode');

const { requestError } = require('../logger/systemLogger');


const logRequestInfosInErrorCase = (error, req, res, next) => {
	if (error) {
		const decodedJWT = decode(req.headers.authorization);
		requestError(req, (decodedJWT || {}).userId, error);
	}
	next(error);
};

const formatErrors = (error, req, res, next) => {
	if (error) {
		delete error.stack;
		delete error.data;
	}
	next(error);
};

const returnAsJson = express.errorHandler({
	html: (error, req, res) => {
		res.json(error);
	},
});

const errorHandler = (app) => {
	app.use(logRequestInfosInErrorCase);
	app.use(Sentry.Handlers.errorHandler());
	app.use(formatErrors);
	app.use(returnAsJson);
};

module.exports = errorHandler;
