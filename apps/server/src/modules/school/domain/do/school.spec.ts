import { schoolFactory } from '../testing';
import { SchoolFeature } from '../type';

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
});
