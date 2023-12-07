import { SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { schoolFactory } from '../testing';

describe('School', () => {
	describe('addFeature', () => {
		const setup = () => {
			const feature = 'test feature' as SchoolFeature;
			const school = schoolFactory.build();

			return { school, feature };
		};

		it('should add the given feature to the features set', () => {
			const { school, feature } = setup();

			school.addFeature(feature);

			expect(school.getProps().features).toContain(feature);
		});
	});

	describe('removeFeature', () => {
		const setup = () => {
			const feature = 'test feature' as SchoolFeature;
			const school = schoolFactory.build({
				features: new Set([feature]),
			});

			return { school, feature };
		};

		it('should remove the given feature from the features set', () => {
			const { school, feature } = setup();

			school.removeFeature(feature);

			expect(school.getProps().features).not.toContain(feature);
		});
	});

	describe('isInMaintenance', () => {
		describe('when inMaintenanceSince is in the past', () => {
			const setup = () => {
				const school = schoolFactory.build({
					inMaintenanceSince: new Date('2020-01-01'),
				});

				return { school };
			};

			it('should return true', () => {
				const { school } = setup();

				const result = school.isInMaintenance();

				expect(result).toBe(true);
			});
		});

		describe('when inMaintenanceSince is in the future', () => {
			const setup = () => {
				const school = schoolFactory.build({
					inMaintenanceSince: new Date('2100-01-01'),
				});

				return { school };
			};

			it('should return false', () => {
				const { school } = setup();

				const result = school.isInMaintenance();

				expect(result).toBe(false);
			});
		});

		describe('when inMaintenanceSince is undefined', () => {
			const setup = () => {
				const school = schoolFactory.build({
					inMaintenanceSince: undefined,
				});

				return { school };
			};

			it('should return false', () => {
				const { school } = setup();

				const result = school.isInMaintenance();

				expect(result).toBe(false);
			});
		});
	});

	describe('isExternal', () => {
		describe('when externalId is set', () => {
			const setup = () => {
				const school = schoolFactory.build({
					externalId: 'test',
				});

				return { school };
			};

			it('should return true', () => {
				const { school } = setup();

				const result = school.isExternal();

				expect(result).toBe(true);
			});
		});

		describe('when externalId is undefined', () => {
			const setup = () => {
				const school = schoolFactory.build({
					externalId: undefined,
				});

				return { school };
			};

			it('should return false', () => {
				const { school } = setup();

				const result = school.isExternal();

				expect(result).toBe(false);
			});
		});
	});

	describe('isEligibleForExternalInvite', () => {
		describe('when school has an eligible purpose and is not the own school', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const otherSchool = schoolFactory.build();

				return { school, otherSchoolId: otherSchool.id };
			};

			it('should return true', () => {
				const { school, otherSchoolId } = setup();

				const result = school.isEligibleForExternalInvite(otherSchoolId);

				expect(result).toBe(true);
			});
		});

		describe('when school has purpose "expert"', () => {
			const setup = () => {
				const school = schoolFactory.build({
					purpose: SchoolPurpose.EXPERT,
				});
				const otherSchool = schoolFactory.build();

				return { school, otherSchoolId: otherSchool.id };
			};

			it('should return false', () => {
				const { school, otherSchoolId } = setup();

				const result = school.isEligibleForExternalInvite(otherSchoolId);

				expect(result).toBe(false);
			});
		});

		describe('when school has purpose "tombstone"', () => {
			const setup = () => {
				const school = schoolFactory.build({
					purpose: SchoolPurpose.TOMBSTONE,
				});
				const otherSchool = schoolFactory.build();

				return { school, otherSchoolId: otherSchool.id };
			};

			it('should return false', () => {
				const { school, otherSchoolId } = setup();

				const result = school.isEligibleForExternalInvite(otherSchoolId);

				expect(result).toBe(false);
			});
		});

		describe('when school is the own school', () => {
			const setup = () => {
				const school = schoolFactory.build();

				return { school, id: school.id };
			};

			it('should return false', () => {
				const { school, id } = setup();

				const result = school.isEligibleForExternalInvite(id);

				expect(result).toBe(false);
			});
		});
	});
});
