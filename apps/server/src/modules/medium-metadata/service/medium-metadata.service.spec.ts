import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client';
import { MediaSourceDataFormat, mediaSourceFactory, MediaSourceService } from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import {
	MediaSourceDataFormatNotFoundLoggableException,
	MediaSourceNotFoundLoggableException,
	MediumMetadataStrategyNotImplementedLoggableException,
} from '../loggable';
import { MediumMetadataMapper } from '../mapper';
import { BiloStrategy, MediumMetadataStrategy, VidisStrategy } from '../strategy';
import { MediumMetadataService } from './medium-metadata.service';

describe(MediumMetadataService.name, () => {
	let module: TestingModule;
	let service: MediumMetadataService;

	let mediaSourceService: DeepMocked<MediaSourceService>;
	let biloStrategy: DeepMocked<BiloStrategy>;
	let vidisStrategy: DeepMocked<VidisStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediumMetadataService,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: BiloStrategy,
					useValue: createMock<BiloStrategy>(),
				},
				{
					provide: VidisStrategy,
					useValue: createMock<VidisStrategy>(),
				},
			],
		}).compile();

		service = module.get(MediumMetadataService);
		mediaSourceService = module.get(MediaSourceService);
		biloStrategy = module.get(BiloStrategy);
		vidisStrategy = module.get(VidisStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetadata', () => {
		describe('when getting media metadata using the bilo strategy', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();
				mediaSourceService.findBySourceId.mockResolvedValue(mediaSource);
				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.VIDIS, vidisStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);
			};

			it('should get the media metadata using the vidis strategy', async () => {
				setup();

				await service.getMetadataItem('mediumId', 'mediaSourceId');

				expect(vidisStrategy.getMediumMetadataItem).toBeCalled();
			});
		});

		describe('when getting media metadata using the bilo strategy', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				const bilomedia = biloMediaQueryDataResponseFactory.build();
				const mediaMetadata = MediumMetadataMapper.mapBiloMetadataToMediumMetadata(bilomedia);

				mediaSourceService.findBySourceId.mockResolvedValue(mediaSource);
				biloStrategy.getMediumMetadataItem.mockResolvedValue(mediaMetadata);

				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.BILDUNGSLOGIN, biloStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);

				return { mediaMetadata };
			};

			it('should get the media metadata using the bilo strategy', async () => {
				const { mediaMetadata } = setup();

				const result = await service.getMetadataItem('mediumId', 'mediaSourceId');

				expect(result).toEqual(mediaMetadata);
			});
		});

		describe('when the media source is missing', () => {
			const setup = () => {
				mediaSourceService.findBySourceId.mockResolvedValue(null);
			};

			it('should throw an MediaSourceDataFormatNotFoundLoggableException', async () => {
				setup();

				const result = service.getMetadataItem('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(new MediaSourceNotFoundLoggableException('mediaSourceId'));
			});
		});

		describe('when the media source has no data format', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				mediaSourceService.findBySourceId.mockResolvedValue(mediaSource);
			};

			it('should throw an MediaSourceDataFormatNotFoundLoggableException', async () => {
				setup();

				const result = service.getMetadataItem('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(new MediaSourceDataFormatNotFoundLoggableException('mediaSourceId'));
			});
		});

		describe('when the strategy is not implemented', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.VIDIS;

				const mediaSource = mediaSourceFactory.withVidis().build();
				mediaSourceService.findBySourceId.mockResolvedValue(mediaSource);

				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.BILDUNGSLOGIN, biloStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);

				return { mediaSourceDataFormat };
			};

			it('should throw an MediumMetadataStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const result = service.getMetadataItem('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(
					new MediumMetadataStrategyNotImplementedLoggableException(mediaSourceDataFormat)
				);
			});
		});
	});
});
