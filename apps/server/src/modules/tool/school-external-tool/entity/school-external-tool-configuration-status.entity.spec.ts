import { setupEntities } from '@shared/testing';
import { schoolExternalToolConfigurationStatusEntityFactory } from '../testing/school-external-tool-configuration-status-entity.factory';
import { SchoolExternalToolConfigurationStatusEntity } from './school-external-tool-configuration-status.entity';

describe('SchoolExternalToolConfigurationStatusEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new SchoolExternalToolConfigurationStatusEntity();
			expect(test).toThrow();
		});

		it('should create a school external tool configuration status by passing required properties', () => {
			const schoolExternalToolConfigurationStatusEntity: SchoolExternalToolConfigurationStatusEntity =
				schoolExternalToolConfigurationStatusEntityFactory.build();
			expect(
				schoolExternalToolConfigurationStatusEntity instanceof SchoolExternalToolConfigurationStatusEntity
			).toEqual(false);
		});

		it('should set school external tool status', () => {
			const schoolExternalToolConfigurationStatusEntity: SchoolExternalToolConfigurationStatusEntity =
				new SchoolExternalToolConfigurationStatusEntity({
					isDeactivated: true,
					isOutdatedOnScopeSchool: false,
				});

			expect(schoolExternalToolConfigurationStatusEntity).toEqual({
				isDeactivated: true,
				isOutdatedOnScopeSchool: false,
			});
		});
	});
});
