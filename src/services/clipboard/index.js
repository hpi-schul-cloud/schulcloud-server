const express = require('@feathersjs/express');
const path = require('path');
const auth = require('@feathersjs/authentication');

module.exports = function () {
	const app = this;
	app.use(
		'/clipboard/uploads',
		auth.express.authenticate(
			'jwt',
			{ exposeCookies: true, exposeHeaders: true }
		),
	);
	app.use('/clipboard/uploads', express.static(path.join(__dirname, '/../../../uploads')));
};
