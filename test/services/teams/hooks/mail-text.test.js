const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('@feathersjs/errors');
const { setupUser, deleteUser } = require('../helper/helper.user');
const { createHook, createHookStack } = require('../helper/helper.hook');
const createEmailText = require('../../../../src/services/teams/hooks/mail-text.js');
const app = require('../../../../src/app');


describe('Team mail-text helper', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe('createEmailText', () => {
		let hook; let
			user;
		before(() => {
			hook = createHook(app, {
				method: 'patch',
				type: 'after',
			});
		});
		it.skip('should work for new expert', () => {
			const hookCopy = Object.assign({}, hook);
			const addClass = app.service('/teams/extern/add');
			const formatResult = addClass._response;
			const user = {
				firstname: '<firstname>',
				lastname: '<lastname>',
				email: '<email>',
				importHash: '<hash>',
			};

			const linkData = {
				link: '<link>',
				target: '<target>',
				hash: '<hash>',
				shortLink: '<shortLink>',
			};

			hookCopy.result = formatResult({
				linkData,
				user,
				isUserCreated: true,
				isResend: false,
				email: user.email,
			});


			console.log(createEmailText(hookCopy, user));
			expect(createEmailText(hookCopy, user)).to.equal({

			});
			// todo check all results ..
		});
	});
});
