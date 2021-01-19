const { expect } = require('chai');
const { createHook } = require('../helper/helper.hook');
const createEmailText = require('../../../../src/services/teams/hooks/mail-text.js');
const appPromise = require('../../../../src/app');

describe('Team mail-text helper', async () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	describe('createEmailText', () => {
		let hook;

		before(() => {
			hook = createHook(app, {
				method: 'patch',
				type: 'after',
			});
		});

		it.skip('should work for new expert', () => {
			const hookCopy = { ...hook };
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
			expect(createEmailText(hookCopy, user)).to.equal({});
			// todo check all results ..
		});
	});
});
