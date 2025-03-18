import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ExternalToolService } from '@modules/tool';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { VidisMetadataSyncStrategy } from './vidis-metadata-sync.strategy';

describe(VidisMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: VidisMetadataSyncStrategy;

	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;
	let externalToolValidationService: DeepMocked<ExternalToolValidationService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisMetadataSyncStrategy,
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(VidisMetadataSyncStrategy);
		encryptionService = module.get(DefaultEncryptionService);
		externalToolService = module.get(ExternalToolService);
		externalToolLogoService = module.get(ExternalToolLogoService);
		externalToolValidationService = module.get(ExternalToolValidationService);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getMediaSourceFormat', () => {
		it('should return the vidis media source data format', () => {
			const result = strategy.getMediaSourceFormat();

			expect(result).toEqual(MediaSourceDataFormat.VIDIS);
		});
	});

	describe('syncAllMediaMetadata', () => {
		describe('when the media metadata is fetched successfully', () => {
			describe('when all the fetched metadata for a medium is valid', () => {});

			describe('when the fetched metadata does not has medium title', () => {});

			describe('when the fetched metadata does not has medium logo', () => {});

			describe('when the logo image type provided is unsupported', () => {});
		});

		describe('when the media metadata could not be fetched successfully', () => {});

		describe('when the media source did not deliver metadata for a medium', () => {});

		describe('when there are no external tools with vidis medium', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([]);

				return { mediaSource };
			};

			it('should return an empty report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual(MediaSourceSyncReportFactory.buildEmptyReport());
			});

			it('should not fetch and update the media metadata of any external tool', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				// TODO vidis fetch
				expect(externalToolService.updateExternalTools).not.toBeCalled();
			});
		});
	});
});
