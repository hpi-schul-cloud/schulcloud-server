import { SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { schoolFactory } from '../../testing';

describe('School', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2022-02-22'));
	});

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
	// TODO N21-1623 add test for getPermissions
	describe('getPermissions', () => {
		describe('when permissions exist', () => {
			const setup = () => {
				const permissions = { teacher: { STUDENT_LIST: true } };
				const school = schoolFactory.build({
					permissions,
				});

				return { school, permissions };
			};

			it('should return permissions', () => {
				const { school, permissions } = setup();

				const result = school.getPermissions();

				expect(result).toEqual(permissions);
			});
		});

		describe('when permissions are undefined', () => {
			const setup = () => {
				const school = schoolFactory.build({
					permissions: undefined,
				});

				return { school };
			};

			it('should return undefined', () => {
				const { school } = setup();

				const result = school.getPermissions();

				expect(result).toBeUndefined();
			});
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

				return { school };
			};

			it('should return false', () => {
				const { school } = setup();

				const result = school.isEligibleForExternalInvite(school.id);

				expect(result).toBe(false);
			});
		});
	});
});
