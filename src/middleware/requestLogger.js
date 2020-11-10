/* eslint-disable no-console */
const queryString = require('qs');
const { DISPLAY_REQUEST_LEVEL } = require('../../config/globals');
/*
	log request information
	default or production is logging disabled
	level 1 only log extern request
	level 2 log intern request too (do not work at the moment)
	level 3 log extern authentication information and route too
	level 4 log intern accounts requests
*/
module.exports = function requstLogger(_app) {
	const app = _app || this;
	const level = DISPLAY_REQUEST_LEVEL;
	app.set('DISPLAY_REQUEST_LEVEL', level);

	if (level > 0) {
		console.log('DISPLAY_REQUEST_LEVEL=', level);
		let counter = -1;
		let lastRequestTime = Date.now();
		const delayTime = 500;
		const print = (req) => {
			const url = req.url.split('?');
			const time = Date.now();
			if (lastRequestTime + delayTime < time) {
				console.log('_____ request _____');
				counter = -1;
			} else {
				console.log(`<<<-extern req-${(counter += 1)}-|||`);
			}
			lastRequestTime = time;
			const query = req.query || queryString.parse(url[1] || '');
			const data = req.body;
			const out = {
				method: req.method,
				url: req.path || url[0],
			};
			if (Object.keys(query).length > 0) {
				out.query = query;
			}
			if (Object.keys(data).length > 0) {
				out.data = data;
			}
			if (level > 2) {
				out.authorization = req.headers.authorization;
			}
			console.log(out);
			console.log(' ');
		};
		app.use((req, res, next) => {
			const shouldPrint = level > 1 || req.feathers.provider === 'rest';
			const printAuth = req.path === '/authentication' ? level > 2 : true;
			if (shouldPrint && printAuth) {
				print(req);
			}
			next();
		});
	}
};
