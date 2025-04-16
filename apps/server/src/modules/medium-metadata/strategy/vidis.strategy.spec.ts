import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OfferDTO, VidisClientAdapter } from '@infra/vidis-client';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { MediaSourceDataFormat, mediaSourceFactory } from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import { ImageMimeType } from '@shared/domain/types';
import { MediumNotFoundLoggableException } from '../loggable';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataLogoService } from '../service/medium-metadata-logo.service';
import { VidisStrategy } from './vidis.strategy';

describe(VidisStrategy.name, () => {
	let module: TestingModule;
	let strategy: VidisStrategy;
	let vidisClientAdapter: DeepMocked<VidisClientAdapter>;
	let mediumMetadataLogoService: DeepMocked<MediumMetadataLogoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisStrategy,
				{
					provide: VidisClientAdapter,
					useValue: createMock<VidisClientAdapter>(),
				},
				{
					provide: MediumMetadataLogoService,
					useValue: createMock<MediumMetadataLogoService>(),
				},
			],
		}).compile();

		strategy = module.get(VidisStrategy);
		vidisClientAdapter = module.get(VidisClientAdapter);
		mediumMetadataLogoService = module.get(MediumMetadataLogoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaSourceFormat', () => {
		it('should return VIDIS as media source format', () => {
			expect(strategy.getMediaSourceFormat()).toBe(MediaSourceDataFormat.VIDIS);
		});
	});

	describe('getMediumMetadataItem', () => {
		describe('when vidis provides no metadata for the requested medium', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSource = mediaSourceFactory.withVidis().build();

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce([]);

				return {
					mediumId,
					mediaSource,
				};
			};

			it('should throw an MediumNotFoundLoggableException', async () => {
				const { mediumId, mediaSource } = setup();

				const promise = strategy.getMediumMetadataItem(mediumId, mediaSource);

				await expect(promise).rejects.toThrow(new MediumNotFoundLoggableException(mediumId, mediaSource.sourceId));
			});
		});

		describe('when vidis provides metadata for the requested medium', () => {
			const setup = () => {
				const offerId = 12345;
				const mediumId = offerId.toString();
				const mediaSource = mediaSourceFactory.withVidis().build();

				const requestedOfferItem = vidisOfferItemFactory.build({ offerId });
				const allOfferItems = vidisOfferItemFactory.buildList(5);
				allOfferItems.push(requestedOfferItem);

				const expectedMetadata = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, {
					...requestedOfferItem,
				});

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(allOfferItems);
				const mimetype: ImageMimeType = ImageMimeType.PNG;

				mediumMetadataLogoService.detectAndValidateLogoImageType.mockReturnValue(mimetype);

				const expectedLogoUrl = `data:${mimetype};base64,${requestedOfferItem.offerLogo ?? ''}`;
				expectedMetadata.logoUrl = expectedLogoUrl;

				return {
					mediumId,
					mediaSource,
					expectedMetadata,
				};
			};

			it('should return the fetched metadata', async () => {
				const { mediumId, mediaSource, expectedMetadata } = setup();

				const result = await strategy.getMediumMetadataItem(mediumId, mediaSource);

				expect(result).toEqual(expectedMetadata);
			});
		});
	});

	describe('getMediumMetadataItems', () => {
		describe('when vidis provides no metadata for the all of the requested mediums', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				const offerIds = [100, 101, 102];
				const offerItems = offerIds.map((_id: number, i: number) =>
					vidisOfferItemFactory.build({ offerId: offerIds[i] })
				);
				const mediumIds: string[] = offerItems.map((_item: OfferDTO, i: number) =>
					(offerIds[i] + offerItems.length).toString()
				);

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(offerItems);

				return {
					mediumIds,
					mediaSource,
				};
			};

			it('should return an empty array', async () => {
				const { mediumIds, mediaSource } = setup();

				const result = await strategy.getMediumMetadataItems(mediumIds, mediaSource);

				expect(result).toEqual([]);
			});
		});

		describe('when vidis provides metadata for the all of the requested mediums', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				const offerIds = [100, 101, 102];

				const offerItems = offerIds.map((_id: number, i: number) =>
					vidisOfferItemFactory.build({ offerId: offerIds[i] })
				);
				const mediumIds: string[] = offerItems.map((_item: OfferDTO, i: number) => offerIds[i].toString());

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(offerItems);

				const expectedMetadataItems = offerItems.map((_item: OfferDTO, i: number) =>
					MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerIds[i].toString(), offerItems[i])
				);

				return {
					mediumIds,
					mediaSource,
					expectedMetadataItems,
				};
			};

			it('should return the fetched metadata items', async () => {
				const { mediumIds, mediaSource, expectedMetadataItems } = setup();

				const result = await strategy.getMediumMetadataItems(mediumIds, mediaSource);

				expect(result).toEqual(expect.arrayContaining(expectedMetadataItems));
			});
		});
	});
});
