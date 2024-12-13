import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
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

	describe('save', () => {
		describe('when saving a media source', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();

				mediaSourceRepo.save.mockResolvedValueOnce(mediaSource);

				return {
					mediaSource,
				};
			};

			it('should save the media source', async () => {
				const { mediaSource } = setup();

				await service.save(mediaSource);

				expect(mediaSourceRepo.save).toHaveBeenCalledWith(mediaSource);
			});

			it('should return the media source', async () => {
				const { mediaSource } = setup();

				const result = await service.save(mediaSource);

				expect(result).toEqual(mediaSource);
			});
		});
	});
});
