const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('feathers-errors');
const { setupUser, deleteUser } = require('../helper/helper.user');
const hooks = require('../../../../src/services/teams/hooks/index.js');
const app = require('../../../../src/app');


describe('Team service hook tests.', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe.skip('sendInfo', () => {
		console.log(hooks.afterExtern.patch); 
	});
});