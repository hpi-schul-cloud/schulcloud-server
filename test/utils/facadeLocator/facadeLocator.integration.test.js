const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const appPromise = require('../../../src/app');

describe.only('Facade Locator integration tests', () => {
	let app;
	let server;

	before(async function setup() {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(function cleanup(done) {
		server.close(done);
	});

	describe('correct setup', () => {
		it('when a facade is registered, then it is accessible', () => {
			const facade = {
				testFunction: () => 'alien invaders',
			};
			app.registerFacade('testfacade', facade);

			const result = app.facade('testfacade').testFunction();

			expect(result).to.equal('alien invaders');
		})
	})
});
