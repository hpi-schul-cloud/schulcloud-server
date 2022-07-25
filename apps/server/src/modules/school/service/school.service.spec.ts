import { School, SchoolFeatures } from '@shared/domain';
import { schoolFactory, setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let orm: MikroORM;
	let schoolDto: SchoolDto;
	let mockSchoolEntities: School[];

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
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		mockSchoolEntities = [schoolFactory.buildWithId(), schoolFactory.buildWithId()];
		schoolDto = new SchoolDto({ name: 'schule1234' });
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

	describe('saveSchool', () => {
		it('should create new school', async () => {
			// Act
			await schoolService.createOrUpdateSchool(schoolDto);

			// Assert
			expect(schoolRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: schoolDto.name }));
			expect(schoolRepo.save).toHaveBeenCalled();
		});

		it('should update existing school', async () => {
			// Arrange
			schoolDto.id = mockSchoolEntities[0].id;

			// Act
			await schoolService.createOrUpdateSchool(schoolDto);

			// Assert
			expect(schoolRepo.findById).toHaveBeenCalledWith(schoolDto.id);
			expect(schoolRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					name: schoolDto.name,
					id: schoolDto.id,
				})
			);
			expect(schoolRepo.create).not.toHaveBeenCalled();
			expect(schoolRepo.save).toHaveBeenCalled();
		});
	});

	describe('hasFeature', () => {
		it('should return true', async () => {
			// Arrange
			schoolRepo.findById.mockResolvedValue(schoolFactory.buildWithId({ features: [SchoolFeatures.VIDEOCONFERENCE] }));

			// Act
			const result = await schoolService.hasFeature('schoolId', SchoolFeatures.VIDEOCONFERENCE);

			// Assert
			expect(result).toBe(true);
		});

		it('should return false', async () => {
			// Arrange
			schoolRepo.findById.mockResolvedValue(schoolFactory.buildWithId());

			// Act
			const result = await schoolService.hasFeature('schoolId', SchoolFeatures.VIDEOCONFERENCE);

			// Assert
			expect(result).toBe(false);
		});
	});
});
