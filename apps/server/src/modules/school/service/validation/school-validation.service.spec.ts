import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain';
import { SchoolRepo } from '@shared/repo';
import { schoolDOFactory } from '@shared/testing';
import { SchoolNumberDuplicateLoggableException } from '../../error';
import { SchoolValidationService } from './school-validation.service';

describe('SchoolValidationService', () => {
	let module: TestingModule;
	let service: SchoolValidationService;

	let schoolRepo: DeepMocked<SchoolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolValidationService,
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolValidationService);
		schoolRepo = module.get(SchoolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('validate', () => {
		describe('when a new school is created and the school number is unique', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ officialSchoolNumber: '1234' });

				schoolRepo.findBySchoolNumber.mockResolvedValue(null);

				return {
					school,
				};
			};

			it('should pass', async () => {
				const { school } = setup();

				await expect(service.validate(school)).resolves.not.toThrow();
			});
		});

		describe('when an existing school is updated and the school number is unique', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ officialSchoolNumber: '1234' });

				schoolRepo.findBySchoolNumber.mockResolvedValue(school);

				return {
					school,
				};
			};

			it('should pass', async () => {
				const { school } = setup();

				await expect(service.validate(school)).resolves.not.toThrow();
			});
		});

		describe('when the school number already exists on another school', () => {
			const setup = () => {
				const newSchool: SchoolDO = schoolDOFactory.buildWithId({ officialSchoolNumber: '1234' });
				const existingSchool: SchoolDO = schoolDOFactory.buildWithId({ officialSchoolNumber: '1234' });

				schoolRepo.findBySchoolNumber.mockResolvedValue(existingSchool);

				return {
					newSchool,
				};
			};

			it('should throw a SchoolNumberDuplicateLoggableException', async () => {
				const { newSchool } = setup();

				const func = async () => service.validate(newSchool);

				await expect(func).rejects.toThrow(SchoolNumberDuplicateLoggableException);
			});
		});
	});
});
