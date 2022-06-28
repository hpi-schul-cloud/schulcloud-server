import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolUc } from '@src/modules/school/uc/school.uc';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;
	let schoolService: SchoolService;
	let schoolDto: SchoolDto;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: {
						saveSchool: jest.fn().mockImplementation((): Promise<void> => {
							return Promise.resolve();
						}),
					},
				},
			],
		}).compile();
		schoolService = module.get(SchoolService);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		schoolDto = new SchoolDto({ name: 'schule1234' });
	});

	describe('saveSchool', () => {
		it('should call schoolService', async () => {
			// Act
			await schoolUc.save(schoolDto);

			// Assert
			expect(schoolService.saveSchool).toHaveBeenCalledWith(expect.objectContaining({ name: schoolDto.name }));
		});
	});
});
