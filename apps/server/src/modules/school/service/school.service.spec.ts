import { SchoolFeatures } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;
	let orm: MikroORM;

	let schoolRepo: DeepMocked<SchoolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolService,
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: SchoolMapper,
					useValue: createMock<SchoolMapper>(),
				},
			],
		}).compile();
		schoolRepo = module.get(SchoolRepo);
		schoolService = module.get(SchoolService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	const setup = () => {
		const systems: string[] = ['systemId'];
		const schoolSaved: SchoolDO = new SchoolDO({
			id: 'testId',
			name: 'schoolName',
			systems,
			features: [SchoolFeatures.VIDEOCONFERENCE],
		});
		const schoolUnsaved: SchoolDO = new SchoolDO({ name: 'school #2}', systems: [] });
		schoolRepo.findById.mockResolvedValue(schoolSaved);
		const schoolSavedId = schoolSaved.id as string;
		return {
			schoolSaved,
			schoolSavedId,
			schoolUnsaved,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createOrUpdate', () => {
		it('should create new school', async () => {
			const { schoolUnsaved } = setup();

			await schoolService.createOrUpdateSchool(schoolUnsaved);

			expect(schoolRepo.save).toHaveBeenCalledWith(schoolUnsaved);
		});

		it('should call the repo when update existing school', async () => {
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

	describe('hasFeature', () => {
		it('should return true', async () => {
			const { schoolSavedId } = setup();

			const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(true);
		});

		it('should return false', async () => {
			const { schoolSaved, schoolSavedId } = setup();
			schoolSaved.features = [];
			schoolRepo.findById.mockResolvedValue(schoolSaved);

			const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(false);
		});
	});

	describe('getSchoolById', () => {
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

	describe('save', () => {
		it('should call the repo', async () => {
			const school: SchoolDO = new SchoolDO({ id: 'id', name: 'name' });

			await schoolService.save(school);

			expect(schoolRepo.save).toHaveBeenCalledWith(school);
		});

		it('should return a do', async () => {
			const school: SchoolDO = new SchoolDO({ id: 'id', name: 'name' });
			schoolRepo.save.mockResolvedValue(school);

			const schoolDO: SchoolDO = await schoolService.save(school);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
	});
});
