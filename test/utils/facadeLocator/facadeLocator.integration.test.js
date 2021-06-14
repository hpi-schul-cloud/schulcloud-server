const chai = require('chai');

const { expect } = chai;
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const appPromise = require('../../../src/app');

describe('Facade Locator integration tests', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	describe('correct setup in app', () => {
		it('when a facade is registered in the app, then it is accessible', () => {
			const facadePath = `realityinvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'illithid invaders',
			};
			app.registerFacade(facadePath, facade);

			const result = app.facade(facadePath).testFunction();

			expect(result).to.equal('illithid invaders');
		});
	});
});
