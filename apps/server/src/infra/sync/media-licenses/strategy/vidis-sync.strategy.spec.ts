import { MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { MediaSourceForSyncNotFoundLoggableException } from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisFetchService, VidisSyncService } from '../service';
import { vidisOfferItemFactory } from '../testing';
import { VidisSyncStrategy } from './vidis-sync.strategy';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let strategy: VidisSyncStrategy;
	let vidisSyncService: DeepMocked<VidisSyncService>;
	let vidisFetchService: DeepMocked<VidisFetchService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncStrategy,
				{
					provide: VidisSyncService,
					useValue: createMock<VidisSyncService>(),
				},
				{
					provide: VidisFetchService,
					useValue: createMock<VidisFetchService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
			],
		}).compile();

		strategy = module.get(VidisSyncStrategy);
		vidisSyncService = module.get(VidisSyncService);
		vidisFetchService = module.get(VidisFetchService);
		mediaSourceService = module.get(MediaSourceService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getType', () => {
		describe('when getType is called', () => {
			it('should return vidis sync strategy target', () => {
				const result = strategy.getType();

				expect(result).toEqual(SyncStrategyTarget.VIDIS);
			});
		});
	});

	describe('sync', () => {
		describe('when the vidis media source is found', () => {
			const setup = () => {
				const format = MediaSourceDataFormat.VIDIS;
				const mediaSource = mediaSourceFactory.withBasicAuthConfig().build({ format });
				const vidisOfferItems = vidisOfferItemFactory.buildList(3);

				mediaSourceService.findByFormat.mockResolvedValueOnce(mediaSource);

				vidisFetchService.getOfferItemsFromVidis.mockResolvedValueOnce(vidisOfferItems);

				return {
					mediaSource,
					vidisOfferItems,
					format,
				};
			};

			it('should find the vidis media source', async () => {
				const { format } = setup();

				await strategy.sync();

				expect(mediaSourceService.findByFormat).toBeCalledWith(format);
			});

			it('should fetch activated offer items from vidis', async () => {
				const { mediaSource } = setup();

				await strategy.sync();

				expect(vidisFetchService.getOfferItemsFromVidis).toBeCalledWith(mediaSource);
			});

			it('should sync the activated offer items with media school licenses in svs', async () => {
				const { mediaSource, vidisOfferItems } = setup();

				await strategy.sync();

				expect(vidisSyncService.syncMediaSchoolLicenses).toBeCalledWith(mediaSource, vidisOfferItems);
			});
		});

		describe('when the vidis media source is not found', () => {
			it('should throw an MediaSourceForSyncNotFoundLoggableException', async () => {
				mediaSourceService.findByFormat.mockResolvedValueOnce(null);

				const promise = strategy.sync();

				await expect(promise).rejects.toThrow(
					new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});
});
