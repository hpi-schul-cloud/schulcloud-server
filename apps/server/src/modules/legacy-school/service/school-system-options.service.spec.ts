import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolSystemOptionsFactory } from '@shared/testing';
import { SchoolSystemOptions } from '../domain';
import { SchoolSystemOptionsRepo } from '../repo';
import { SchoolSystemOptionsService } from './school-system-options.service';

describe(SchoolSystemOptionsService.name, () => {
	let module: TestingModule;
	let service: SchoolSystemOptionsService;

	let schoolSystemOptionsRepo: DeepMocked<SchoolSystemOptionsRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolSystemOptionsService,
				{
					provide: SchoolSystemOptionsRepo,
					useValue: createMock<SchoolSystemOptionsRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolSystemOptionsService);
		schoolSystemOptionsRepo = module.get(SchoolSystemOptionsRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findBySchoolIdAndSystemId', () => {
		describe('when there are options', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build();

				schoolSystemOptionsRepo.findBySchoolIdAndSystemId.mockResolvedValue(schoolSystemOptions);

				return {
					schoolSystemOptions,
				};
			};

			it('should return the options', async () => {
				const { schoolSystemOptions } = setup();

				const result: SchoolSystemOptions | null = await service.findBySchoolIdAndSystemId(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId
				);

				expect(result).toEqual(schoolSystemOptions);
			});
		});

		describe('when there are no options', () => {
			const setup = () => {
				schoolSystemOptionsRepo.findBySchoolIdAndSystemId.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: SchoolSystemOptions | null = await service.findBySchoolIdAndSystemId(
					new ObjectId().toHexString(),
					new ObjectId().toHexString()
				);

				expect(result).toBeNull();
			});
		});
	});

	describe('save', () => {
		describe('when saving options', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build();

				schoolSystemOptionsRepo.save.mockResolvedValue(schoolSystemOptions);

				return {
					schoolSystemOptions,
				};
			};

			it('should save the options', async () => {
				const { schoolSystemOptions } = setup();

				await service.save(schoolSystemOptions);

				expect(schoolSystemOptionsRepo.save).toHaveBeenCalledWith(schoolSystemOptions);
			});

			it('should return the options', async () => {
				const { schoolSystemOptions } = setup();

				const result: SchoolSystemOptions = await service.save(schoolSystemOptions);

				expect(result).toEqual(schoolSystemOptions);
			});
		});
	});
});
