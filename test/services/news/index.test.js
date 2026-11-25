const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const sleep = require('util').promisify(setTimeout);

const appPromise = require('../../../src/app');
const { newsModel: News } = require('../../../src/services/news/model');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

describe('news service', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		nestServices = await setupNestServices(app);
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

});
