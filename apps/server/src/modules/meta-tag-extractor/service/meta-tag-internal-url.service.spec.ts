import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { MetaData } from '../types';
import { MetaTagExtractorService } from './meta-tag-extractor.service';
import { MetaTagInternalUrlService } from './meta-tag-internal-url.service';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './url-handler';

const INTERNAL_DOMAIN = 'my-school-cloud.org';
const INTERNAL_URL = `https://${INTERNAL_DOMAIN}/my-article`;
const UNKNOWN_INTERNAL_URL = `https://${INTERNAL_DOMAIN}/playground/23hafe23234`;
const EXTERNAL_URL = 'https://de.wikipedia.org/example-article';

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
			Configuration.set('SC_DOMAIN', INTERNAL_DOMAIN);
			taskUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			lessonUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			courseUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			boardUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
		};

		it('should return true for internal urls', () => {
			setup();

			expect(service.isInternalUrl(INTERNAL_URL)).toBe(true);
		});

		it('should return false for external urls', () => {
			setup();

			expect(service.isInternalUrl(EXTERNAL_URL)).toBe(false);
		});
	});

	describe('tryInternalLinkMetaTags', () => {
		const setup = () => {
			Configuration.set('SC_DOMAIN', INTERNAL_DOMAIN);
			taskUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			lessonUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			boardUrlHandler.doesUrlMatch.mockReturnValueOnce(false);
			const mockedMetaTags: MetaData = {
				title: 'My Title',
				url: INTERNAL_URL,
				description: '',
				type: 'course',
			};

			return { mockedMetaTags };
		};

		describe('when url matches to a handler', () => {
			it('should return the handlers meta tags', async () => {
				const { mockedMetaTags } = setup();
				courseUrlHandler.doesUrlMatch.mockReturnValueOnce(true);
				courseUrlHandler.getMetaData.mockResolvedValueOnce(mockedMetaTags);

				const result = await service.tryInternalLinkMetaTags(INTERNAL_URL);

				expect(result).toEqual(mockedMetaTags);
			});
		});

		describe('when url matches to none of the handlers', () => {
			it('should return default meta tags', async () => {
				setup();
				courseUrlHandler.doesUrlMatch.mockReturnValueOnce(false);

				const result = await service.tryInternalLinkMetaTags(UNKNOWN_INTERNAL_URL);

				expect(result).toEqual(expect.objectContaining({ type: 'unknown' }));
			});
		});

		describe('when url is external', () => {
			it('should return undefined', async () => {
				setup();
				courseUrlHandler.doesUrlMatch.mockReturnValueOnce(false);

				const result = await service.tryInternalLinkMetaTags(EXTERNAL_URL);

				expect(result).toBeUndefined();
			});
		});
	});
});
