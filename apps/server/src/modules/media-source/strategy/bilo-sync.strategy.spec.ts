import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolService } from '@modules/tool';
import { MediaSourceService, BiloMediaFetchService } from '../service';
import { MediaSourceDataFormat } from '../enum';
import { BiloSyncStrategy } from './bilo-sync.strategy';

describe(BiloSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloSyncStrategy;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let biloMediaFetchService: DeepMocked<BiloMediaFetchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloSyncStrategy,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: BiloMediaFetchService,
					useValue: createMock<BiloMediaFetchService>(),
				},
			],
		}).compile();

		strategy = module.get(BiloSyncStrategy);
		mediaSourceService = module.get(MediaSourceService);
		externalToolService = module.get(ExternalToolService);
		biloMediaFetchService = module.get(BiloMediaFetchService);
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

	describe('syncAllMediaMetadata', () => {
		it('should return the correct sync report', () => {
			// 	TODO
		});
	});
});
