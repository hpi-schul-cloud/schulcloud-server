import { setupEntities } from '@shared/testing';
import { federalStateFactory } from '@shared/testing/factory/federalstate.factory';
import { FederalState } from './federalstate.entity';

describe('federalstate entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a federalstate', () => {
			const setup = () => federalStateFactory.build();

			it('should create federalstate', () => {
				const fs = setup();
				expect(fs).toBeInstanceOf(FederalState);
			});
		});
	});
});
