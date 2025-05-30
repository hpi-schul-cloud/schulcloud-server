import { createMock } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ExternalToolValidationService } from '@modules/tool/external-tool';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolMetadataUpdateService } from '../external-tool-metadata-update.service';
import { VidisMetadataSyncStrategy } from './vidis-metadata-sync.strategy';

describe(VidisMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: VidisMetadataSyncStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisMetadataSyncStrategy,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: MediumMetadataService,
					useValue: createMock<MediumMetadataService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: ExternalToolMetadataUpdateService,
					useValue: createMock<ExternalToolMetadataUpdateService>(),
				},
			],
		}).compile();

		strategy = module.get(VidisMetadataSyncStrategy);
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
});
