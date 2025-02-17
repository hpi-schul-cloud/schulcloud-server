import { Test, TestingModule } from '@nestjs/testing';
import axios, { CancelTokenSource } from 'axios';
import Stream from 'stream';
import { MetaTagExternalUrlService } from './meta-tag-external-url.service';

jest.mock('axios');

type OgImageMockData = { name: string; width: number };
type HtmlMockData = { title?: string; description?: string; ogImages?: OgImageMockData[] };

describe(MetaTagExternalUrlService.name, () => {
	let module: TestingModule;
	let service: MetaTagExternalUrlService;
	let mockedAxios: jest.Mocked<typeof axios>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MetaTagExternalUrlService],
		}).compile();

		service = module.get(MetaTagExternalUrlService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetModules();
		mockedAxios = axios as jest.Mocked<typeof axios>;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('tryExtractMetaTags', () => {
		const mockReadstream = (chunks: string[]) => {
			const mockedStream = new Stream.Readable();
			mockedStream._read = jest.fn();

			const intervalHandle = setInterval(() => {
				if (chunks.length === 0) {
					clearInterval(intervalHandle);
					mockedStream.push(null);
				} else {
					mockedStream.push(chunks.shift());
				}
			}, 100);

			return mockedStream;
		};

		const mockOgImages = (ogImages: OgImageMockData[]) =>
			ogImages
				.map(
					({ name, width }) =>
						`<meta property="og:image" content="https://example.com/${name}" />
						<meta property="og:image:width" content="${width}" />
						<meta property="og:image:height" content="${Math.floor((width / 4) * 3)}" />`
				)
				.join('');

		const mockHtmlStart = ({
			title = 'Great Html-Page',
			description = 'the description',
			ogImages = [],
		}: HtmlMockData = {}) => `
		<!DOCTYPE html>
		<html>
			<head>
				<title>${title}</title>
				<meta name="description" content="${description}">
				${mockOgImages(ogImages)}
			</head>
		`;

		const mockParagraph = (string = 'a', characterCount = 50000) =>
			`<p>${string.repeat(characterCount).slice(0, characterCount - 7)}</p>`;

		const createCancelTokenSource = () => {
			const cancelTokenSource: CancelTokenSource = {
				cancel: jest.fn(),
				token: {
					promise: new Promise(() => {}),
					throwIfRequested: jest.fn().mockImplementation(() => {
						mockedAxios.isCancel.mockReturnValue(true);
						throw new Error('user canceled');
					}),
					reason: { message: 'user canceled' },
				},
			};
			return cancelTokenSource;
		};

		describe('when html of page is short', () => {
			it('should extract title and description', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValueOnce(cancelTokenSource);

				const title = 'Great Title';
				const description = 'Great Description';
				const mockedStream = mockReadstream([mockHtmlStart({ title, description })]);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				const result = await service.tryExtractMetaTags(url);

				expect(result?.title).toEqual(title);
				expect(result?.description).toEqual(description);
			}, 60000);

			it('should not need to cancel', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const mockedStream = mockReadstream(['<html><head><title>test</title></head></html>']);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				await service.tryExtractMetaTags(url);

				expect(cancelTokenSource.cancel).not.toHaveBeenCalled();
			}, 60000);
		});

		describe('when html of page is huge', () => {
			it('should only take the first 50000 characters', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const title = 'Great Title';
				const description = 'Great Description';
				const mockedStream = mockReadstream([
					mockHtmlStart({ title, description }),
					mockParagraph('inside,', 50000),
					mockParagraph('outside,', 50000),
				]);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				const result = await service.tryExtractMetaTags(url);

				expect(result?.title).toEqual(title);
				expect(result?.description).toEqual(description);
				expect(cancelTokenSource.cancel).toHaveBeenCalled();
			});
		});

		describe('when html of page contains images', () => {
			it('should return an image', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const ogImages = [{ name: 'rock.jpg', width: 2000 }];

				const mockedStream = mockReadstream([mockHtmlStart({ ogImages })]);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				const result = await service.tryExtractMetaTags(url);

				expect(result?.originalImageUrl).toBeDefined();
			});

			describe('when multiple images are present', () => {
				it('should return the image with the lowest but high enough resolution', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [
						{ name: 'paper.jpg', width: 400 },
						{ name: 'rock.jpg', width: 2000 },
						{ name: 'scissors.jpg', width: 300 },
					];

					const mockedStream = mockReadstream([mockHtmlStart({ ogImages })]);
					mockedAxios.get.mockResolvedValue({ data: mockedStream });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/paper.jpg');
				});
			});
		});

		describe('when html not contains images', () => {
			it('should return no image', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const ogImages = [];
				const mockedStream = mockReadstream([mockHtmlStart({ ogImages })]);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				const result = await service.tryExtractMetaTags(url);

				expect(result?.originalImageUrl).toBeUndefined();
			});
		});

		describe('when html creates an error', () => {
			it('should return undefined', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const mockedStream = mockReadstream([]);
				mockedAxios.get.mockResolvedValue({ data: mockedStream });

				const result = await service.tryExtractMetaTags(url);

				expect(result).toBeUndefined();
			});
		});

		describe('when server responds with 401', () => {
			it('should return undefined', async () => {
				const url = new URL('https://docs.dbildungscloud.de/display/DBH/Arc+Weekly+Meetings');

				mockedAxios.get.mockRejectedValue({ response: { status: 401 } });

				const result = await service.tryExtractMetaTags(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
