import { SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { schoolFactory } from '../../testing';

describe('School', () => {
	describe('addFeature', () => {
		it('should add the given feature to the features set', () => {
			const school = schoolFactory.build();

			school.addFeature('test feature' as SchoolFeature);

			expect(school.getProps().features).toContain('test feature');
		});
	});

	describe('removeFeature', () => {
		it('should remove the given feature from the features set', () => {
			const feature = 'test feature' as SchoolFeature;
			const school = schoolFactory.build({
				features: new Set([feature]),
			});

			school.removeFeature(feature);

			expect(school.getProps().features).not.toContain('test feature');
		});
	});

	describe('isInMaintenance', () => {
		describe('when inMaintenanceSince is in the past', () => {
			it('should return true', () => {
				const school = schoolFactory.build({
					inMaintenanceSince: new Date('2020-01-01'),
				});

				const result = school.isInMaintenance();

				expect(result).toBe(true);
			});
		});

		describe('when inMaintenanceSince is in the future', () => {
			it('should return false', () => {
				const school = schoolFactory.build({
					inMaintenanceSince: new Date('2100-01-01'),
				});

				const result = school.isInMaintenance();

				expect(result).toBe(false);
			});
		});

		describe('when inMaintenanceSince is undefined', () => {
			it('should return false', () => {
				const school = schoolFactory.build();

				const result = school.isInMaintenance();

				expect(result).toBe(false);
			});
		});
	});

	describe('isExternal', () => {
		describe('when externalId is set', () => {
			it('should return true', () => {
				const school = schoolFactory.build({
					externalId: 'test',
				});

				const result = school.isExternal();

				expect(result).toBe(true);
			});
		});

		describe('when externalId is undefined', () => {
			it('should return false', () => {
				const school = schoolFactory.build();

				const result = school.isExternal();

				expect(result).toBe(false);
			});
		});
	});

	describe('isEligibleForExternalInvite', () => {
		describe('when school has an eligible purpose and is not the own school', () => {
			it('should return true', () => {
				const school = schoolFactory.build({
					id: 'test',
				});

				const result = school.isEligibleForExternalInvite('other school id');

				expect(result).toBe(true);
			});
		});

		describe('when school has purpose "expert"', () => {
			it('should return false', () => {
				const school = schoolFactory.build({
					purpose: SchoolPurpose.EXPERT,
					id: 'test',
				});

				const result = school.isEligibleForExternalInvite('other school id');

				expect(result).toBe(false);
			});
		});

		describe('when school has purpose "tombstone"', () => {
			it('should return false', () => {
				const school = schoolFactory.build({
					purpose: SchoolPurpose.TOMBSTONE,
					id: 'test',
				});

				const result = school.isEligibleForExternalInvite('other school id');

				expect(result).toBe(false);
			});
		});

		describe('when school is the own school', () => {
			it('should return false', () => {
				const testId = 'test';
				const school = schoolFactory.build({
					id: testId,
				});

				const result = school.isEligibleForExternalInvite(testId);

				expect(result).toBe(false);
			});
		});
	});
});
