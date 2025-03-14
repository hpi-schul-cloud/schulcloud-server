import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BiloMediaClientAdapter } from '@infra/bilo-client';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediumMetadataMapper } from '../mapper';
import { BiloStrategy } from './bilo.strategy';

describe(BiloStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloStrategy;

	let biloMediaClientAdapter: DeepMocked<BiloMediaClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloStrategy,
				{
					provide: BiloMediaClientAdapter,
					useValue: createMock<BiloMediaClientAdapter>(),
				},
			],
		}).compile();

		strategy = module.get(BiloStrategy);
		biloMediaClientAdapter = module.get(BiloMediaClientAdapter);
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

	describe('getMediumMetadata', () => {
		describe('when mediumId and media source are given', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const metadataItem = biloMediaQueryDataResponseFactory.build({ id: mediumId });

				biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce([metadataItem]);

				const expectedMediaMetadataDto = MediumMetadataMapper.mapBiloMetadataToMediumMetadata(metadataItem);

				return { mediumId, mediaSource, expectedMediaMetadataDto };
			};

			it('should return the fetched media metadata', async () => {
				const { mediumId, mediaSource, expectedMediaMetadataDto } = setup();

				const result = await strategy.getMediumMetadata(mediumId, mediaSource);

				expect(result).toEqual(expectedMediaMetadataDto);
			});
		});
	});
});
