const { expect, assert } = require('chai');
const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const sinon = require('sinon');

const { setupFacadeLocator, setupFacades } = require('../../../src/utils/facadeLocator');

describe.only('facadeLocator', () => {
	describe('unit tests', () => {
		it('when a facade is registered, then it is accessible via the app.', () => {
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				testFunction: () => 'space invaders',
			};
			app.registerFacade('testfacade', facade);

			const result = app.facade('testfacade').testFunction();

			expect(result).to.equal('space invaders');
		});

		it('when trying to call a facade that doesnt exist, then undefined is returned', () => {
			const app = express(feathers());
			setupFacadeLocator(app);

			const result = app.facade('thisdoesntexist');

			expect(result).to.be.undefined;
		});

		it('when a facade is registered, then its setup method is called', async () => {
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				setup: (application) => application,
			};
			const spy = sinon.spy(facade, 'setup');
			app.registerFacade('testfacade', facade);
			setupFacades(app);

			assert(spy.calledOnce);
		});

		it('when a facade is registered with trailing or leading slashes, then the slashes are ignored', () => {
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				testFunction: () => 'alien invaders',
			};
			app.registerFacade('/testfacade/', facade);

			const result = app.facade('testfacade').testFunction();

			expect(result).to.equal('alien invaders');
		});

		it('when a facade is called with trailing or leading slashes, then the slashes are ignored', () => {
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				testFunction: () => 'dinosaurier invaders',
			};
			app.registerFacade('testfacade', facade);

			const result = app.facade('/testfacade/').testFunction();

			expect(result).to.equal('dinosaurier invaders');
		});

		it('when a facade is overwritten, then only the new facade is accessible', () => {
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				testFunction: () => 'goblin invaders',
			};
			app.registerFacade('/testfacade/', facade);

			const owerwritefacade = {
				testFunction: () => 'ork invaders',
			};
			app.registerFacade('/testfacade/', owerwritefacade);

			const result = app.facade('testfacade').testFunction();

			expect(result).to.equal('ork invaders');
		});
	});
});
