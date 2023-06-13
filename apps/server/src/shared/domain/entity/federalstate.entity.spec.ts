import { setupEntities } from '@shared/testing';
import { federalStateFactory } from '@shared/testing/factory/federalstate.factory';
import { FederalState } from './federalstate.entity';

describe('federalstate entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a federalstate', () => {
			it('should create federalstate', () => {
				const fs = federalStateFactory.build();
				expect(fs).toBeInstanceOf(FederalState);
			});
		});
	});
});
