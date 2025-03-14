import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceRepo } from '../repo';
import { mediaSourceFactory } from '../testing';
import { MediaSourceService } from './media-source.service';

describe(MediaSourceService.name, () => {
	let module: TestingModule;
	let service: MediaSourceService;

	let mediaSourceRepo: DeepMocked<MediaSourceRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourceService,
				{
					provide: MediaSourceRepo,
					useValue: createMock<MediaSourceRepo>(),
				},
			],
		}).compile();

		service = module.get(MediaSourceService);
		mediaSourceRepo = module.get(MediaSourceRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findBySourceId', () => {
		describe('when searching for a media source', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();

				mediaSourceRepo.findBySourceId.mockResolvedValueOnce(mediaSource);

				return {
					mediaSource,
				};
			};

			it('should return the media source', async () => {
				const { mediaSource } = setup();

				const result = await service.findBySourceId(mediaSource.sourceId);

				expect(result).toEqual(mediaSource);
			});
		});
	});

	describe('findByFormat', () => {
		describe('when a media source data format is given', () => {
			const setup = () => {
				const format = MediaSourceDataFormat.VIDIS;
				const mediaSource = mediaSourceFactory.build({ format });

				mediaSourceRepo.findByFormat.mockResolvedValueOnce(mediaSource);

				return {
					format,
					mediaSource,
				};
			};

			it('should return the media source', async () => {
				const { format, mediaSource } = setup();

				const result = await service.findByFormat(format);

				expect(mediaSourceRepo.findByFormat).toBeCalledWith(format);
				expect(result).toEqual(mediaSource);
			});
		});
	});

	describe('saveAll', () => {
		describe('when saving media sources', () => {
			const setup = () => {
				const mediaSources = mediaSourceFactory.buildList(2);

				mediaSourceRepo.saveAll.mockResolvedValueOnce(mediaSources);

				return {
					mediaSources,
				};
			};

			it('should save the media sources', async () => {
				const { mediaSources } = setup();

				await service.saveAll(mediaSources);

				expect(mediaSourceRepo.saveAll).toHaveBeenCalledWith(mediaSources);
			});

			it('should return the media sources', async () => {
				const { mediaSources } = setup();

				const result = await service.saveAll(mediaSources);

				expect(result).toEqual(mediaSources);
			});
		});
	});

	describe('findByFormatAndSourceId', () => {
		describe('when a media source data format and source id is given', () => {
			const setup = () => {
				const format = MediaSourceDataFormat.VIDIS;
				const sourceId = 'source-id';
				const mediaSource = mediaSourceFactory.build({ format, sourceId });

				mediaSourceRepo.findByFormatAndSourceId.mockResolvedValueOnce(mediaSource);

				return {
					format,
					sourceId,
					mediaSource,
				};
			};

			it('should return the media source', async () => {
				const { format, sourceId, mediaSource } = setup();

				const result = await service.findByFormatAndSourceId(format, sourceId);

				expect(mediaSourceRepo.findByFormatAndSourceId).toBeCalledWith(format, sourceId);
				expect(result).toEqual(mediaSource);
			});
		});
	});

	describe('getAllMediaSources', () => {
		describe('when media sources are available', () => {
			const setup = () => {
				const mediaSources = mediaSourceFactory.buildList(2);

				mediaSourceRepo.findAll.mockResolvedValueOnce(mediaSources);

				return {
					mediaSources,
				};
			};

			it('should return a list of media sources', async () => {
				const { mediaSources } = setup();

				const result = await service.getAllMediaSources();

				expect(result).toEqual(mediaSources);
				expect(mediaSources).toHaveLength(2);
			});

			it('should call the media source repo', async () => {
				setup();

				await service.getAllMediaSources();

				expect(mediaSourceRepo.findAll).toBeCalled();
			});
		});

		describe('when no media sources are available', () => {
			const setup = () => {
				const mediaSources = [];

				mediaSourceRepo.findAll.mockResolvedValueOnce(mediaSources);

				return {
					mediaSources,
				};
			};

			it('should return an empty list', async () => {
				const { mediaSources } = setup();

				const result = await service.getAllMediaSources();

				expect(result).toEqual(mediaSources);
				expect(mediaSources).toHaveLength(0);
			});

			it('should call the media source repo', async () => {
				setup();

				await service.getAllMediaSources();

				expect(mediaSourceRepo.findAll).toBeCalled();
			});
		});
	});
});
