import { ObjectId } from '@mikro-orm/mongodb';
import { LanguageType } from '@shared/domain/interface';
import { SchoolPurpose } from '@shared/domain/types';
import { federalStateFactory, schoolFactory } from '../../testing';
import { InstanceFeature } from '../type';

describe('School', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2022-02-22'));
	});

	describe('addInstanceFeature', () => {
		describe('when instanceFeatures is already initialized', () => {
			const setup = () => {
				const feature = InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED;
				const school = schoolFactory.build({ instanceFeatures: new Set() });

				return { school, feature };
			};

			it('should add the given feature to the set', () => {
				const { school, feature } = setup();

				school.addInstanceFeature(feature);

				expect(school.getProps().instanceFeatures).toContain(feature);
			});
		});

		describe('when instanceFeatures is not initialized', () => {
			const setup = () => {
				const feature = InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED;
				const school = schoolFactory.build({ instanceFeatures: undefined });

				return { school, feature };
			};

			it('should initialize it and add the given feature to the set', () => {
				const { school, feature } = setup();

				school.addInstanceFeature(feature);

				expect(school.getProps().instanceFeatures).toContain(feature);
			});
		});
	});

	describe('removeInstanceFeature', () => {
		const setup = () => {
			const feature = InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED;
			const school = schoolFactory.build({ instanceFeatures: new Set([feature]) });

			return { school, feature };
		};

		it('should remove the given feature from the features set', () => {
			const { school, feature } = setup();

			school.removeInstanceFeature(feature);

			expect(school.getProps().instanceFeatures).not.toContain(feature);
		});
	});

	describe('update county', () => {
		describe('when county is not set in federal state', () => {
			const setup = () => {
				const school = schoolFactory.build();
				const countyId = new ObjectId().toHexString();

				return { school, countyId };
			};

			it('should throw `county not found` error', () => {
				const { school, countyId } = setup();

				expect(() => school.updateCounty(countyId)).toThrowError('County not found.');
			});
		});

		describe('when county is already set', () => {
			const setup = () => {
				const federalState = federalStateFactory.build();
				// @ts-expect-error test case
				const county = federalState.getProps().counties[0];
				const school = schoolFactory.build({ federalState, county });
				const countyId = new ObjectId().toHexString();

				return { school, countyId };
			};

			it('should throw `county cannot be updated, once it is set` error', () => {
				const { school, countyId } = setup();

				expect(() => school.updateCounty(countyId)).toThrowError('County cannot be updated, once it is set.');
			});
		});

		describe('when county is not set', () => {
			const setup = () => {
				const federalState = federalStateFactory.build();
				// @ts-expect-error test case
				const county = federalState.getProps().counties[0];
				const school = schoolFactory.build({ federalState });
				const countyId = county.id;

				return { school, countyId, county };
			};

			it('should return school with county', () => {
				const { school, countyId, county } = setup();

				school.updateCounty(countyId);

				expect(school.getProps().county).toEqual(county);
			});
		});
	});

	describe('updateOfficialSchoolNumber', () => {
		describe('when officialSchoolNumber is already set', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: '123' });
				const officialSchoolNumber = '456';

				return { school, officialSchoolNumber };
			};

			it('should throw `official school number cannot be updated, once it is set` error', () => {
				const { school, officialSchoolNumber } = setup();

				expect(() => school.updateOfficialSchoolNumber(officialSchoolNumber)).toThrowError(
					'Official school number cannot be updated, once it is set.'
				);
			});
		});

		describe('when officialSchoolNumber is not set', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: undefined });
				const officialSchoolNumber = '456';

				return { school, officialSchoolNumber };
			};

			it('should return school with updated officialSchoolNumber', () => {
				const { school, officialSchoolNumber } = setup();

				school.updateOfficialSchoolNumber(officialSchoolNumber);

				expect(school.getProps().officialSchoolNumber).toEqual(officialSchoolNumber);
			});
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

	describe('getInfo', () => {
		describe('when in school logo informations and language are NOT set', () => {
			const setup = () => {
				const expectedResult = {
					id: new ObjectId().toHexString(),
					name: 'abc',
				};

				const school = schoolFactory.build(expectedResult);

				return { school, expectedResult };
			};

			it('should return an object with id and name', () => {
				const { school, expectedResult } = setup();

				const result = school.getInfo();

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when in school logo informations and language are set', () => {
			const setup = () => {
				const expectedResult = {
					id: new ObjectId().toHexString(),
					name: 'abc',
					language: LanguageType.DE,
					logo: { dataUrl: 'adsbasdh', name: 'logoA' },
				};

				const school = schoolFactory.build(expectedResult);

				return { school, expectedResult };
			};

			it('should return an object with all expected keys', () => {
				const { school, expectedResult } = setup();

				const result = school.getInfo();

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
