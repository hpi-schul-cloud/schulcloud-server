import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceService } from '@modules/mediasource/service';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { VidisSyncService } from './vidis-sync.service';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let httpService: DeepMocked<HttpService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let encryptionService: DeepMocked<SymetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		httpService = module.get(HttpService);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// TODO: implementation
	describe('syncMediaSchoolLicenses', () => {
		describe('when the media source with correct configs is found', () => {
			const setup = () => {};

			it('should not throw any error', () => {
				setup();
			});
		});

		describe('when there is an error fetching data from media source', () => {
			const setup = () => {};

			it('should throw an error', () => {
				setup();
			});
		});
	});
});
