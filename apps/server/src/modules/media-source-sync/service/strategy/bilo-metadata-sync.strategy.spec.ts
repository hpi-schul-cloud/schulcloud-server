import { createMock } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolMetadataUpdateService } from '../external-tool-metadata-update.service';
import { BiloMetadataSyncStrategy } from './bilo-metadata-sync.strategy';

describe(BiloMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloMetadataSyncStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloMetadataSyncStrategy,
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

		strategy = module.get(BiloMetadataSyncStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaSourceFormat', () => {
		it('should return the bilo data format', () => {
			const result = strategy.getMediaSourceFormat();

			expect(result).toEqual(MediaSourceDataFormat.BILDUNGSLOGIN);
		});
	});
});
