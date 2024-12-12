import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSchoolLicenseRepo } from '@modules/school-license/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from '@modules/school';
import { Logger } from '@src/core/logger';

describe(MediaSchoolLicenseService.name, () => {
	let module: TestingModule;
	let mediaSchoolLicenseRepo: DeepMocked<MediaSchoolLicenseRepo>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseService,
				{
					provide: MediaSchoolLicenseRepo,
					useValue: createMock<MediaSchoolLicenseRepo>,
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>,
				},
				{
					provide: Logger,
					useValue: createMock<Logger>,
				},
			],
		}).compile();

		mediaSchoolLicenseRepo = module.get(MediaSchoolLicenseRepo);
		schoolService = module.get(SchoolService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// TODO: implementation
	describe('syncMediaSchoolLicenses', () => {
		describe('when a media source and items are given', () => {
			const setup = () => {};

			it('it should save the school licenses', () => {
				setup();
			});
		});
	});
});
