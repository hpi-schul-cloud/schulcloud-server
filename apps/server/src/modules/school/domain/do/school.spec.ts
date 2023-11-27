import { schoolFactory } from '../testing';
import { SchoolFeature, SchoolPurpose } from '../type';

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
		it('should return true if inMaintenanceSince is in the past', () => {
			const school = schoolFactory.build({
				inMaintenanceSince: new Date('2020-01-01'),
			});

			const result = school.isInMaintenance();

			expect(result).toBe(true);
		});

		it('should return false if inMaintenanceSince is in the future', () => {
			const school = schoolFactory.build({
				inMaintenanceSince: new Date('2100-01-01'),
			});

			const result = school.isInMaintenance();

			expect(result).toBe(false);
		});

		it('should return false if inMaintenanceSince is undefined', () => {
			const school = schoolFactory.build();

			const result = school.isInMaintenance();

			expect(result).toBe(false);
		});
	});

	describe('isExternal', () => {
		it('should return true if externalId is set', () => {
			const school = schoolFactory.build({
				externalId: 'test',
			});

			const result = school.isExternal();

			expect(result).toBe(true);
		});

		it('should return false if externalId is undefined', () => {
			const school = schoolFactory.build();

			const result = school.isExternal();

			expect(result).toBe(false);
		});
	});

	describe('isEligibleForExternalInvite', () => {
		it('should return true if school has an eligible purpose and is not the own school', () => {
			const school = schoolFactory.build({
				id: 'test',
			});

			const result = school.isEligibleForExternalInvite('other school id');

			expect(result).toBe(true);
		});

		it('should return false if school has purpose "expert"', () => {
			const school = schoolFactory.build({
				purpose: SchoolPurpose.EXPERT,
				id: 'test',
			});

			const result = school.isEligibleForExternalInvite('other school id');

			expect(result).toBe(false);
		});

		it('should return false if school has purpose "tombstone"', () => {
			const school = schoolFactory.build({
				purpose: SchoolPurpose.TOMBSTONE,
				id: 'test',
			});

			const result = school.isEligibleForExternalInvite('other school id');

			expect(result).toBe(false);
		});

		it('should return false if school is the own school', () => {
			const testId = 'test';
			const school = schoolFactory.build({
				id: testId,
			});

			const result = school.isEligibleForExternalInvite(testId);

			expect(result).toBe(false);
		});
	});
});
