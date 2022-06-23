import { School } from '@shared/domain';
import { schoolFactory, setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;
	let schoolRepo: SchoolRepo;
	let orm: MikroORM;
	let schoolDto: SchoolDto;
	const mockSchoolEntities: School[] = [schoolFactory.buildWithId(), schoolFactory.buildWithId()];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolService,
				{
					provide: SchoolRepo,
					useValue: {
						save: jest.fn().mockImplementation((school: School): Promise<void> => {
							return Promise.resolve();
						}),
						findById: jest.fn().mockImplementation((schoolId: string): Promise<School | null> => {
							const school = mockSchoolEntities.find((tmpSchool) => tmpSchool.id?.toString() === schoolId);
							return school ? Promise.resolve(school) : Promise.resolve(null);
						}),
					},
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
		schoolDto = new SchoolDto({ name: 'schule1234' });
	});

	describe('saveSchool', () => {
		it('should create new school', async () => {
			// Act
			await schoolService.saveSchool(schoolDto);

			// Assert
			expect(schoolRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: schoolDto.name }));
		});

		it('should update existing school', async () => {
			// Arrange
			schoolDto.id = mockSchoolEntities[0].id;

			// Act
			await schoolService.saveSchool(schoolDto);

			// Assert
			expect(schoolRepo.findById).toHaveBeenCalledWith(schoolDto.id);
			expect(schoolRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					name: schoolDto.name,
					id: schoolDto.id,
				})
			);
		});
	});
});
