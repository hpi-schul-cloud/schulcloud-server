import chai from 'chai';
import chaiHttp from 'chai-http';
import appPromise from '../../../src/app';

const { expect } = chai;
chai.use(chaiHttp);

describe('Facade Locator integration tests', () => {
	let app;
	let server;

	before(async function setup() {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(function cleanup(done) {
		server.close(done);
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
