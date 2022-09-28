import { School, SchoolFeatures, System } from '@shared/domain';
import { schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;
	let orm: MikroORM;

	let schoolRepo: DeepMocked<SchoolRepo>;

	let school1Dto: SchoolDto;
	let mockSchoolEntities: School[];
	let system: System;

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

	beforeEach(() => {
		system = systemFactory.buildWithId();
		const school1: School = schoolFactory.buildWithId({ name: 'schoolName' });
		const school2: School = schoolFactory.buildWithId();
		school1.systems.add(system);
		mockSchoolEntities = [school1, school2];
		school1Dto = new SchoolDto({ name: school1.name, systemIds: [system.id] });
		schoolRepo.create.mockImplementation((): School => {
			return mockSchoolEntities[0];
		});
		schoolRepo.findById.mockImplementation((schoolId: string): Promise<School> => {
			const school = mockSchoolEntities.find((tmpSchool) => tmpSchool.id?.toString() === schoolId);
			return school ? Promise.resolve(school) : Promise.reject();
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createOrUpdate', () => {
		it('should create new school', async () => {
			await schoolService.createOrUpdateSchool(school1Dto);

			expect(schoolRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: school1Dto.name }));
			expect(schoolRepo.save).toHaveBeenCalled();
		});

		it('should update existing school', async () => {
			school1Dto.id = mockSchoolEntities[0].id;

			await schoolService.createOrUpdateSchool(school1Dto);

			expect(schoolRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					name: school1Dto.name,
					id: school1Dto.id,
				})
			);
			expect(schoolRepo.create).not.toHaveBeenCalled();
		});
	});

	describe('hasFeature', () => {
		it('should return true', async () => {
			schoolRepo.findById.mockResolvedValue(schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] }));

			const result = await schoolService.hasFeature('schoolId', SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(true);
		});

		it('should return false', async () => {
			schoolRepo.findById.mockResolvedValue(schoolFactory.buildWithId());

			const result = await schoolService.hasFeature('schoolId', SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(false);
		});
	});
});
