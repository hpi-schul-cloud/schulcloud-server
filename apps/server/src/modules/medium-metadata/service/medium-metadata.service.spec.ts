import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client';
import { MediaSourceDataFormat, mediaSourceFactory, MediaSourceRepo } from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import { MediumMetadataMapper } from '../mapper';
import { BiloStrategy, MediumMetadataStrategy, VidisStrategy } from '../strategy';
import { MediumMetadataService } from './medium-metadata.service';
import {
	MediaSourceDataFormatNotFoundLoggableException,
	MediaSourceNotFoundLoggableException,
	MediumMetadataStrategyNotImplementedLoggableException,
} from '../loggable';

describe(MediumMetadataService.name, () => {
	let module: TestingModule;
	let service: MediumMetadataService;

	let mediaSourceRepo: DeepMocked<MediaSourceRepo>;
	let biloStrategy: DeepMocked<BiloStrategy>;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let vidisStrategy: DeepMocked<VidisStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediumMetadataService,
				{
					provide: MediaSourceRepo,
					useValue: createMock<MediaSourceRepo>(),
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
		mediaSourceRepo = module.get(MediaSourceRepo);
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
				mediaSourceRepo.findBySourceId.mockResolvedValue(mediaSource);
				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.VIDIS, vidisStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);
			};

			it('should get the media metadata using the vidis strategy', async () => {
				setup();

				await service.getMetadata('mediumId', 'mediaSourceId');

				expect(vidisStrategy.getMediumMetadata).toBeCalled();
			});
		});

		describe('when getting media metadata using the bilo strategy', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				const bilomedia = biloMediaQueryDataResponseFactory.build();
				const mediaMetadata = MediumMetadataMapper.mapBiloMetadataToMediumMetadata(bilomedia);

				mediaSourceRepo.findBySourceId.mockResolvedValue(mediaSource);
				biloStrategy.getMediumMetadata.mockResolvedValue(mediaMetadata);

				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.BILDUNGSLOGIN, biloStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);

				return { mediaMetadata };
			};

			it('should get the media metadata using the bilo strategy', async () => {
				const { mediaMetadata } = setup();

				const result = await service.getMetadata('mediumId', 'mediaSourceId');

				expect(result).toEqual(mediaMetadata);
			});
		});

		describe('when the media source is missing', () => {
			const setup = () => {
				mediaSourceRepo.findBySourceId.mockResolvedValue(null);
			};

			it('should throw an MediaSourceDataFormatNotFoundLoggableException', async () => {
				setup();

				const result = service.getMetadata('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(new MediaSourceNotFoundLoggableException('mediaSourceId'));
			});
		});

		describe('when the media source has no  data format', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				mediaSourceRepo.findBySourceId.mockResolvedValue(mediaSource);
			};

			it('should throw an MediaSourceDataFormatNotFoundLoggableException', async () => {
				setup();

				const result = service.getMetadata('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(new MediaSourceDataFormatNotFoundLoggableException('mediaSourceId'));
			});
		});

		describe('when the strategy is not implemented', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.VIDIS;

				const mediaSource = mediaSourceFactory.withVidis().build();
				mediaSourceRepo.findBySourceId.mockResolvedValue(mediaSource);

				const strategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>([
					[MediaSourceDataFormat.BILDUNGSLOGIN, biloStrategy],
				]);
				Reflect.set(service, 'mediumMetadataStrategyMap', strategyMap);

				return { mediaSourceDataFormat };
			};

			it('should throw an MediumMetadataStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const result = service.getMetadata('mediumId', 'mediaSourceId');

				await expect(result).rejects.toThrow(
					new MediumMetadataStrategyNotImplementedLoggableException(mediaSourceDataFormat)
				);
			});
		});
	});
});
