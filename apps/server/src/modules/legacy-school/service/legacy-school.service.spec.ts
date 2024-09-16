import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { SchoolFeature } from '@shared/domain/types';
import { LegacySchoolRepo } from '@shared/repo';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import {
	federalStateFactory,
	legacySchoolDoFactory,
	schoolYearFactory,
	setupEntities,
	storageProviderFactory,
} from '@shared/testing';
import { FederalStateService } from './federal-state.service';
import { LegacySchoolService } from './legacy-school.service';
import { SchoolYearService } from './school-year.service';
import { SchoolValidationService } from './validation/school-validation.service';

describe('LegacySchoolService', () => {
	let module: TestingModule;
	let schoolService: LegacySchoolService;

	let schoolRepo: DeepMocked<LegacySchoolRepo>;
	let storageProviderRepo: DeepMocked<StorageProviderRepo>;
	let schoolValidationService: DeepMocked<SchoolValidationService>;
	let federalStateService: DeepMocked<FederalStateService>;
	let schoolYearService: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LegacySchoolService,
				{
					provide: LegacySchoolRepo,
					useValue: createMock<LegacySchoolRepo>(),
				},
				{
					provide: StorageProviderRepo,
					useValue: createMock<StorageProviderRepo>(),
				},
				{
					provide: SchoolValidationService,
					useValue: createMock<SchoolValidationService>(),
				},
				{
					provide: FederalStateService,
					useValue: createMock<FederalStateService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
			],
		}).compile();

		schoolRepo = module.get(LegacySchoolRepo);
		storageProviderRepo = module.get(StorageProviderRepo);
		schoolService = module.get(LegacySchoolService);
		schoolValidationService = module.get(SchoolValidationService);
		federalStateService = module.get(FederalStateService);
		schoolYearService = module.get(SchoolYearService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	const setupOld = () => {
		const systems: string[] = ['systemId'];
		const schoolSaved: LegacySchoolDo = legacySchoolDoFactory.build({
			id: 'testId',
			name: 'schoolName',
			externalId: 'externalId',
			officialSchoolNumber: '9999',
			systems,
			features: [SchoolFeature.VIDEOCONFERENCE],
		});
		const schoolUnsaved: LegacySchoolDo = legacySchoolDoFactory.build({ name: 'school #2}', systems: [] });
		schoolRepo.findById.mockResolvedValue(schoolSaved);
		schoolRepo.findByExternalId.mockResolvedValue(schoolSaved);
		schoolRepo.findBySchoolNumber.mockResolvedValue(schoolSaved);
		const schoolSavedId = schoolSaved.id as string;
		const schoolSavedExternalId = schoolSaved.externalId as string;
		const schoolSavedNumber = schoolSaved.officialSchoolNumber as string;
		return {
			schoolSaved,
			schoolSavedId,
			schoolSavedExternalId,
			schoolSavedNumber,
			systems,
			schoolUnsaved,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('hasFeature is called', () => {
		describe('when given schoolFeature exists on school', () => {
			it('should return true', async () => {
				const { schoolSavedId } = setupOld();

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeature.VIDEOCONFERENCE);

				expect(result).toBe(true);
			});
		});

		describe('when given schoolFeature does not exist on school', () => {
			it('should return false', async () => {
				const { schoolSaved, schoolSavedId } = setupOld();
				schoolSaved.features = [];
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeature.VIDEOCONFERENCE);

				expect(result).toBe(false);
			});
		});

		describe('when features of school is undefined', () => {
			it('should return false', async () => {
				const { schoolSaved, schoolSavedId } = setupOld();
				schoolSaved.features = undefined;
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeature.VIDEOCONFERENCE);

				expect(result).toBe(false);
			});
		});
	});

	describe('removeFeature', () => {
		describe('when given schoolFeature exists on school', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					features: [SchoolFeature.VIDEOCONFERENCE, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				schoolRepo.findById.mockResolvedValue(school);

				return {
					schoolId: school.id as string,
				};
			};

			it('should call schoolRepo.findById', async () => {
				const { schoolId } = setup();

				await schoolService.removeFeature(schoolId, SchoolFeature.OAUTH_PROVISIONING_ENABLED);

				expect(schoolRepo.findById).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when school has a feature which should be removed', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					features: [SchoolFeature.VIDEOCONFERENCE, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				});

				schoolRepo.findById.mockResolvedValue(school);

				return {
					schoolId: school.id as string,
				};
			};

			it('should save school without given feature', async () => {
				const { schoolId } = setup();

				await schoolService.removeFeature(schoolId, SchoolFeature.OAUTH_PROVISIONING_ENABLED);

				expect(schoolRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						features: [SchoolFeature.VIDEOCONFERENCE],
					})
				);
			});
		});
	});

	describe('getSchoolById is called', () => {
		describe('when id is given', () => {
			it('should call the repo', async () => {
				const { schoolSavedId } = setupOld();

				await schoolService.getSchoolById(schoolSavedId);

				expect(schoolRepo.findById).toHaveBeenCalledWith(schoolSavedId);
			});

			it('should return a do', async () => {
				const { schoolSavedId } = setupOld();

				const schoolDO: LegacySchoolDo = await schoolService.getSchoolById(schoolSavedId);

				expect(schoolDO).toBeInstanceOf(LegacySchoolDo);
			});
		});
	});

	describe('getSchoolByExternalId', () => {
		it('should call the repo', async () => {
			const { schoolSavedExternalId, systems } = setupOld();

			await schoolService.getSchoolByExternalId(schoolSavedExternalId, systems[0]);

			expect(schoolRepo.findByExternalId).toHaveBeenCalledWith(schoolSavedExternalId, systems[0]);
		});

		it('should return a do', async () => {
			const { schoolSavedExternalId, systems } = setupOld();

			const schoolDO: LegacySchoolDo | null = await schoolService.getSchoolByExternalId(
				schoolSavedExternalId,
				systems[0]
			);

			expect(schoolDO).toBeInstanceOf(LegacySchoolDo);
		});
		it('should return null', async () => {
			const { systems } = setupOld();

			schoolRepo.findByExternalId.mockResolvedValue(null);

			const schoolDO: LegacySchoolDo | null = await schoolService.getSchoolByExternalId('null', systems[0]);

			expect(schoolDO).toBeNull();
		});
	});

	describe('when a school is searched by schoolnumber', () => {
		it('should call the repo', async () => {
			const { schoolSavedNumber } = setupOld();

			await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolRepo.findBySchoolNumber).toHaveBeenCalledWith(schoolSavedNumber);
		});

		it('should return a do', async () => {
			const { schoolSavedNumber } = setupOld();

			const schoolDO: LegacySchoolDo | null = await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolDO).toBeInstanceOf(LegacySchoolDo);
		});
		it('should return null', async () => {
			schoolRepo.findBySchoolNumber.mockResolvedValue(null);

			const schoolDO: LegacySchoolDo | null = await schoolService.getSchoolBySchoolNumber('null');

			expect(schoolDO).toBeNull();
		});
	});

	describe('save is called', () => {
		describe('when validation is deactivated', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.build();

				schoolRepo.save.mockResolvedValue(school);

				return {
					school,
				};
			};

			it('should call the repo', async () => {
				const { school } = setup();

				await schoolService.save(school);

				expect(schoolRepo.save).toHaveBeenCalledWith(school);
			});

			it('should return a do', async () => {
				const { school } = setup();

				const schoolDO: LegacySchoolDo = await schoolService.save(school);

				expect(schoolDO).toBeDefined();
			});

			it('should call the validation service', async () => {
				const { school } = setup();

				await schoolService.save(school);

				expect(schoolValidationService.validate).not.toHaveBeenCalled();
			});
		});

		describe('when validation is active', () => {
			describe('when the validation fails', () => {
				const setup = () => {
					const school: LegacySchoolDo = legacySchoolDoFactory.build();

					schoolRepo.save.mockResolvedValueOnce(school);
					schoolValidationService.validate.mockRejectedValueOnce(new Error());

					return {
						school,
					};
				};

				it('should reject', async () => {
					const { school } = setup();

					const func = () => schoolService.save(school, true);

					await expect(func).rejects.toThrow();
				});

				it('should call the validation service', async () => {
					const { school } = setup();

					await expect(schoolService.save(school, true)).rejects.toThrow();

					expect(schoolValidationService.validate).toHaveBeenCalledWith(school);
				});

				it('should not save', async () => {
					const { school } = setup();

					await expect(schoolService.save(school, true)).rejects.toThrow();

					expect(schoolRepo.save).not.toHaveBeenCalled();
				});
			});

			describe('when the validation succeeds', () => {
				const setup = () => {
					const school: LegacySchoolDo = legacySchoolDoFactory.build();

					schoolRepo.save.mockResolvedValueOnce(school);

					return {
						school,
					};
				};

				it('should call the repo', async () => {
					const { school } = setup();

					await schoolService.save(school, true);

					expect(schoolRepo.save).toHaveBeenCalledWith(school);
				});

				it('should return a do', async () => {
					const { school } = setup();

					const schoolDO: LegacySchoolDo = await schoolService.save(school, true);

					expect(schoolDO).toBeDefined();
				});

				it('should call the validation service', async () => {
					const { school } = setup();

					await schoolService.save(school, true);

					expect(schoolValidationService.validate).toHaveBeenCalledWith(school);
				});
			});
		});
	});

	describe('create school', () => {
		describe('when a school is created', () => {
			const setup = () => {
				const name = 'Hogwarts';
				const federalStateName = 'maybescottland?';
				const federalState = federalStateFactory.build({ name: federalStateName });
				const year = schoolYearFactory.build();
				federalStateService.findFederalStateByName.mockResolvedValue(federalState);
				schoolYearService.getCurrentOrNextSchoolYear.mockResolvedValue(year);
				const storageProvider = storageProviderFactory.build();
				storageProviderRepo.findAll.mockResolvedValue([storageProvider]);
				return { name, federalStateName, federalState };
			};

			it('should return school', async () => {
				const { name, federalStateName, federalState } = setup();

				const school = await schoolService.createSchool({ name, federalStateName });
				expect(school.name).toEqual(name);
				expect(school.federalState).toEqual(federalState);
			});

			it('should persist school', async () => {
				const { name, federalStateName } = setup();

				const school = await schoolService.createSchool({ name, federalStateName });
				expect(schoolRepo.save).toHaveBeenCalledWith(school);
			});
		});

		describe('when no storage provider is found', () => {
			const setup = () => {
				const name = 'Hogwarts';
				const federalStateName = 'maybescottland?';
				const federalState = federalStateFactory.build({ name: federalStateName });
				const year = schoolYearFactory.build();
				federalStateService.findFederalStateByName.mockResolvedValue(federalState);
				schoolYearService.getCurrentOrNextSchoolYear.mockResolvedValue(year);
				storageProviderRepo.findAll.mockResolvedValue([]);
				return { name, federalStateName };
			};

			it('should throw error', async () => {
				const { name, federalStateName } = setup();

				await expect(schoolService.createSchool({ name, federalStateName })).rejects.toThrowError(
					'No storage providers found'
				);
			});
		});
	});
});
