import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { LegacySchoolDo } from '@shared/domain/domainobject';
import { LegacySchoolRepo } from '@shared/repo';
import { legacySchoolDoFactory } from '@shared/testing/factory';
import { SchoolNumberDuplicateLoggableException } from '../../loggable';
import { SchoolValidationService } from './school-validation.service';

describe(SchoolValidationService.name, () => {
	let module: TestingModule;
	let service: SchoolValidationService;

	let schoolRepo: DeepMocked<LegacySchoolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolValidationService,
				{
					provide: LegacySchoolRepo,
					useValue: createMock<LegacySchoolRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolValidationService);
		schoolRepo = module.get(LegacySchoolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('validate', () => {
		describe('isSchoolNumberUnique', () => {
			describe('when a school has no official school number', () => {
				const setup = () => {
					const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: undefined });

					return {
						school,
					};
				};

				it('should pass', async () => {
					const { school } = setup();

					await expect(service.validate(school)).resolves.not.toThrow();
				});
			});

			describe('when a new school is created and the school number is unique', () => {
				const setup = () => {
					const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: '1234' });

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
					const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: '1234' });

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
					const newSchool: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: '1234' });
					const existingSchool: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: '1234' });

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
});
