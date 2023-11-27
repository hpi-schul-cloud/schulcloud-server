const { expect } = require('chai');
const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');

const { setupFacadeLocator, facadeLocator } = require('../../../src/utils/facadeLocator');

describe('facadeLocator', () => {
	describe('facadeLocator', () => {
		it('when a face is registered, then it is accessible', () => {
			const facadePath = `spaceinvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'space invaders',
			};
			facadeLocator.registerFacade(facadePath, facade);

			const result = facadeLocator.facade(facadePath).testFunction();

			expect(result).to.equal('space invaders');
		});

		it('when trying to call a facade that doesnt exist, then undefined is returned', () => {
			const result = facadeLocator.facade('thisdoesntexist');

			expect(result).to.be.undefined;
		});

		it('when a facade is registered with trailing or leading slashes, then the slashes are ignored', () => {
			const facadePath = `alieninvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'alien invaders',
			};
			facadeLocator.registerFacade(`/${facadePath}/`, facade);

			const result = facadeLocator.facade(facadePath).testFunction();

			expect(result).to.equal('alien invaders');
		});

		it('when a facade is called with trailing or leading slashes, then the slashes are ignored', () => {
			const facadePath = `dinoinvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'dinosaurier invaders',
			};
			facadeLocator.registerFacade(facadePath, facade);

			const result = facadeLocator.facade(`/${facadePath}/`).testFunction();

			expect(result).to.equal('dinosaurier invaders');
		});

		it('when a facade is overwritten, then only the new facade is accessible', () => {
			const facadePath = `greenskininvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'goblin invaders',
			};
			facadeLocator.registerFacade(facadePath, facade);

			const owerwritefacade = {
				testFunction: () => 'ork invaders',
			};
			facadeLocator.registerFacade(facadePath, owerwritefacade);

			const result = facadeLocator.facade(facadePath).testFunction();

			expect(result).to.equal('ork invaders');
		});
	});

	describe('facade locator via app', () => {
		it('when a facade is registered, then it is accessible via the app', () => {
			const facadePath = `undeadinvasion${Date.now()}`;
			const facade = {
				testFunction: () => 'undead invaders',
			};
			facadeLocator.registerFacade(facadePath, facade);

			const app = express(feathers());
			setupFacadeLocator(app);

			const result = app.facade(facadePath).testFunction();

			expect(result).to.equal('undead invaders');
		});

		it('when a facade is registered via the app, then it is accessible', () => {
			const facadePath = `colonisation${Date.now()}`;
			const app = express(feathers());
			setupFacadeLocator(app);
			const facade = {
				testFunction: () => 'colonist invaders',
			};
			app.registerFacade(facadePath, facade);

			const result = facadeLocator.facade(facadePath).testFunction();

			expect(result).to.equal('colonist invaders');
		});
	});
});
