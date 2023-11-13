import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { MetaData } from '../types';
import { MetaTagExtractorService } from './meta-tag-extractor.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './url-handler';

describe(MetaTagExtractorService.name, () => {
	let module: TestingModule;
	let taskUrlHandler: DeepMocked<TaskUrlHandler>;
	let lessonUrlHandler: DeepMocked<LessonUrlHandler>;
	let courseUrlHandler: DeepMocked<CourseUrlHandler>;
	let boardUrlHandler: DeepMocked<BoardUrlHandler>;
	let service: MetaTagInternalUrlService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MetaTagInternalUrlService,
				{
					provide: TaskUrlHandler,
					useValue: createMock<TaskUrlHandler>(),
				},
				{
					provide: LessonUrlHandler,
					useValue: createMock<LessonUrlHandler>(),
				},
				{
					provide: CourseUrlHandler,
					useValue: createMock<CourseUrlHandler>(),
				},
				{
					provide: BoardUrlHandler,
					useValue: createMock<BoardUrlHandler>(),
				},
			],
		}).compile();

		taskUrlHandler = module.get(TaskUrlHandler);
		lessonUrlHandler = module.get(LessonUrlHandler);
		courseUrlHandler = module.get(CourseUrlHandler);
		boardUrlHandler = module.get(BoardUrlHandler);
		service = module.get(MetaTagInternalUrlService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('isInternalUrl', () => {
		const setup = () => {
			Configuration.set('SC_DOMAIN', 'localhost');
			taskUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			lessonUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			courseUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			boardUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
		};

		it('should return true for internal urls', () => {
			setup();

			const INTERNAL_URL = 'https://localhost/my-article';
			expect(service.isInternalUrl(INTERNAL_URL)).toBe(true);
		});

		it('should return false for external urls', () => {
			setup();

			const EXTERNAL_URL = 'https://de.wikipedia.org/example-article';
			expect(service.isInternalUrl(EXTERNAL_URL)).toBe(false);
		});
	});

	describe('tryInternalLinkMetaTags', () => {
		const setup = () => {
			Configuration.set('SC_DOMAIN', 'localhost');
			taskUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			lessonUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			boardUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			const url = 'https://localhost/fitting-url';
			const mockedMetaTags: MetaData = {
				title: 'My Title',
				url,
				description: '',
				type: 'course',
			};

			return { mockedMetaTags, url };
		};

		describe('when url matches to a handler', () => {
			it('should return the handlers meta tags', async () => {
				const { mockedMetaTags, url } = setup();
				courseUrlHandler.doesUrlMatch.mockReturnValueOnce(true);
				courseUrlHandler.getMetaData.mockResolvedValueOnce(mockedMetaTags);

				const result = await service.tryInternalLinkMetaTags(url);

				expect(result).toEqual(mockedMetaTags);
			});
		});

		describe('when url matches to none of the handlers', () => {
			it('should return default meta tags', async () => {
				setup();
				courseUrlHandler.doesUrlMatch.mockReturnValueOnce(false);

				const internalUrl = 'https://localhost/playground/23hafe23234';
				const result = await service.tryInternalLinkMetaTags(internalUrl);

				expect(result).toEqual(expect.objectContaining({ type: 'unknown' }));
			});
		});
	});
});
