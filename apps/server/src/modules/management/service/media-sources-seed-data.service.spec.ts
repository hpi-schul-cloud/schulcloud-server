import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { MediaSourceVidisConfig } from '@modules/media-source/domain';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourcesSeedDataService } from './media-sources-seed-data.service';

describe(MediaSourcesSeedDataService.name, () => {
	let module: TestingModule;
	let service: MediaSourcesSeedDataService;

	let configService: DeepMocked<ConfigService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourcesSeedDataService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(MediaSourcesSeedDataService);
		configService = module.get(ConfigService);
		mediaSourceService = module.get(MediaSourceService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when the vidis secrets are defined', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce('test-username');
				configService.get.mockReturnValueOnce('test-password');
				encryptionService.encrypt.mockReturnValueOnce('encrypted-test-username');
				encryptionService.encrypt.mockReturnValueOnce('encrypted-test-password');
			};

			it('should encrypt the secrets', async () => {
				setup();

				await service.import();

				expect(encryptionService.encrypt).toHaveBeenCalledWith('test-username');
				expect(encryptionService.encrypt).toHaveBeenCalledWith('test-password');
			});

			it('should import vidis', async () => {
				setup();

				await service.import();

				expect(mediaSourceService.save).toHaveBeenCalledWith<[MediaSource]>(
					new MediaSource({
						id: '675b0b71553441da9a893bf9',
						name: 'VIDIS',
						sourceId: 'vidis.fwu.de',
						format: MediaSourceDataFormat.VIDIS,
						vidisConfig: new MediaSourceVidisConfig({
							username: 'encrypted-test-username',
							password: 'encrypted-test-password',
							baseUrl: 'https://service-stage.vidis.schule/o/vidis-rest',
							region: 'test-region',
						}),
					})
				);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});

		describe('when the vidis secrets are not defined', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(undefined);
				configService.get.mockReturnValueOnce(undefined);
			};

			it('should not import vidis', async () => {
				setup();

				await service.import();

				expect(mediaSourceService.save).not.toHaveBeenCalled();
			});

			it('should return 0', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(0);
			});
		});
	});
});
