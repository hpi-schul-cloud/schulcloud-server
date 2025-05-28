import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BiloMediaClientAdapter } from '@infra/bilo-client';
import {
	BiloBadRequestResponseLoggableException,
	BiloNotFoundResponseLoggableException,
} from '@infra/bilo-client/loggable';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import {
	MediumBadRequestLoggableException,
	MediumMetadataNotFoundLoggableException,
	MediumNotFoundLoggableException,
} from '../loggable';
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

	describe('getMediumMetadataItem', () => {
		describe('when mediumId and media source are given', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const metadataItem = biloMediaQueryDataResponseFactory.build({ id: mediumId });

				biloMediaClientAdapter.fetchMediumMetadata.mockResolvedValueOnce(metadataItem);

				const expectedMediaMetadataDto = MediumMetadataMapper.mapBiloMediumMetadataToMediumMetadata(metadataItem);

				return { mediumId, mediaSource, expectedMediaMetadataDto };
			};

			it('should return the fetched media metadata', async () => {
				const { mediumId, mediaSource, expectedMediaMetadataDto } = setup();

				const result = await strategy.getMediumMetadataItem(mediumId, mediaSource);

				expect(result).toEqual(expectedMediaMetadataDto);
			});
		});

		describe('when medium not found', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				biloMediaClientAdapter.fetchMediumMetadata.mockRejectedValueOnce(new BiloNotFoundResponseLoggableException());

				return { mediumId, mediaSource };
			};

			it('should throw not found exception', async () => {
				const { mediumId, mediaSource } = setup();

				const promise = strategy.getMediumMetadataItem(mediumId, mediaSource);

				await expect(promise).rejects.toThrow(MediumNotFoundLoggableException);
			});
		});

		describe('when medium metadata not found', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				biloMediaClientAdapter.fetchMediumMetadata.mockRejectedValueOnce(
					new MediumMetadataNotFoundLoggableException(mediumId, mediaSource.id)
				);

				return { mediumId, mediaSource };
			};

			it('should throw not found exception', async () => {
				const { mediumId, mediaSource } = setup();

				const promise = strategy.getMediumMetadataItem(mediumId, mediaSource);

				await expect(promise).rejects.toThrow(MediumMetadataNotFoundLoggableException);
			});
		});
		describe('when media provider returns bad request response', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				biloMediaClientAdapter.fetchMediumMetadata.mockRejectedValueOnce(new BiloBadRequestResponseLoggableException());

				return { mediumId, mediaSource };
			};

			it('should throw bad request exception', async () => {
				const { mediumId, mediaSource } = setup();

				const promise = strategy.getMediumMetadataItem(mediumId, mediaSource);

				await expect(promise).rejects.toThrow(MediumBadRequestLoggableException);
			});
		});
	});

	describe('getMediumMetadataItems', () => {
		describe('when mediumIds and media source are given', () => {
			const setup = () => {
				const mediumId = 'medium-id';
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const metadataItem = biloMediaQueryDataResponseFactory.build({ id: mediumId });

				biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce([metadataItem]);

				const expectedMediaMetadataDto = MediumMetadataMapper.mapBiloMediumMetadataToMediumMetadata(metadataItem);

				return { mediumId, mediaSource, expectedMediaMetadataDto };
			};

			it('should return the fetched media metadata', async () => {
				const { mediumId, mediaSource, expectedMediaMetadataDto } = setup();

				const result = await strategy.getMediumMetadataItems([mediumId], mediaSource);

				expect(result).toEqual([expectedMediaMetadataDto]);
			});
		});
	});
});
