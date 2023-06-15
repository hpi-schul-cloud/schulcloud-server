import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolFeatures } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo } from '@shared/repo';
import { schoolDOFactory, setupEntities } from '@shared/testing';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;

	let schoolRepo: DeepMocked<SchoolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolService,
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
			],
		}).compile();
		schoolRepo = module.get(SchoolRepo);
		schoolService = module.get(SchoolService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const systems: string[] = ['systemId'];
		const schoolSaved: SchoolDO = schoolDOFactory.build({
			id: 'testId',
			name: 'schoolName',
			externalId: 'externalId',
			officialSchoolNumber: '9999',
			systems,
			features: [SchoolFeatures.VIDEOCONFERENCE],
		});
		const schoolUnsaved: SchoolDO = schoolDOFactory.build({ name: 'school #2}', systems: [] });
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

	describe('createOrUpdate is called', () => {
		describe('when a school doesnt exist yet', () => {
			it('should create new school', async () => {
				const { schoolUnsaved } = setup();

				await schoolService.createOrUpdateSchool(schoolUnsaved);

				expect(schoolRepo.save).toHaveBeenCalledWith(schoolUnsaved);
			});
		});

		describe('when update existing school', () => {
			it('should call the repo', async () => {
				const { schoolSaved } = setup();

				await schoolService.createOrUpdateSchool(schoolSaved);

				expect(schoolRepo.findById).toHaveBeenCalledWith(schoolSaved.id);
			});

			it('should update existing school', async () => {
				const { schoolSaved, schoolSavedId } = setup();
				schoolSaved.name = 'loadedSchool';
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				await schoolService.createOrUpdateSchool(schoolSaved);

				expect(schoolRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						name: 'loadedSchool',
						id: schoolSavedId,
					})
				);
			});
		});
	});

	describe('hasFeature is called', () => {
		describe('when given schoolFeature exists on school', () => {
			it('should return true', async () => {
				const { schoolSavedId } = setup();

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

				expect(result).toBe(true);
			});
		});

		describe('when given schoolFeature does not exist on school', () => {
			it('should return false', async () => {
				const { schoolSaved, schoolSavedId } = setup();
				schoolSaved.features = [];
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

				expect(result).toBe(false);
			});
		});

		describe('when features of school is undefined', () => {
			it('should return false', async () => {
				const { schoolSaved, schoolSavedId } = setup();
				schoolSaved.features = undefined;
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

				expect(result).toBe(false);
			});
		});
	});

	describe('getSchoolById is called', () => {
		describe('when id is given', () => {
			it('should call the repo', async () => {
				const { schoolSavedId } = setup();

				await schoolService.getSchoolById(schoolSavedId);

				expect(schoolRepo.findById).toHaveBeenCalledWith(schoolSavedId);
			});

			it('should return a do', async () => {
				const { schoolSavedId } = setup();

				const schoolDO: SchoolDO = await schoolService.getSchoolById(schoolSavedId);

				expect(schoolDO).toBeInstanceOf(SchoolDO);
			});
		});
	});

	describe('getSchoolByExternalId', () => {
		it('should call the repo', async () => {
			const { schoolSavedExternalId, systems } = setup();

			await schoolService.getSchoolByExternalId(schoolSavedExternalId, systems[0]);

			expect(schoolRepo.findByExternalId).toHaveBeenCalledWith(schoolSavedExternalId, systems[0]);
		});

		it('should return a do', async () => {
			const { schoolSavedExternalId, systems } = setup();

			const schoolDO: SchoolDO | null = await schoolService.getSchoolByExternalId(schoolSavedExternalId, systems[0]);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
		it('should return null', async () => {
			const { systems } = setup();

			schoolRepo.findByExternalId.mockResolvedValue(null);

			const schoolDO: SchoolDO | null = await schoolService.getSchoolByExternalId('null', systems[0]);

			expect(schoolDO).toBeNull();
		});
	});

	describe('when a school is searched by schoolnumber', () => {
		it('should call the repo', async () => {
			const { schoolSavedNumber } = setup();

			await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolRepo.findBySchoolNumber).toHaveBeenCalledWith(schoolSavedNumber);
		});

		it('should return a do', async () => {
			const { schoolSavedNumber } = setup();

			const schoolDO: SchoolDO | null = await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
		it('should return null', async () => {
			schoolRepo.findBySchoolNumber.mockResolvedValue(null);

			const schoolDO: SchoolDO | null = await schoolService.getSchoolBySchoolNumber('null');

			expect(schoolDO).toBeNull();
		});
	});

	describe('save is called', () => {
		const setupSave = () => {
			const school: SchoolDO = schoolDOFactory.build();
			schoolRepo.save.mockResolvedValue(school);

			return {
				school,
			};
		};

		describe('when school is given', () => {
			it('should call the repo', async () => {
				const { school } = setupSave();

				await schoolService.save(school);

				expect(schoolRepo.save).toHaveBeenCalledWith(school);
			});

			it('should return a do', async () => {
				const { school } = setupSave();

				const schoolDO: SchoolDO = await schoolService.save(school);

				expect(schoolDO).toBeDefined();
			});
		});
	});
});
