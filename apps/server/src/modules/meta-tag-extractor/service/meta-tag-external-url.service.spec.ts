import { Test, type TestingModule } from '@nestjs/testing';
import axios, { type CancelTokenSource } from 'axios';
import Stream from 'node:stream';
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';
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
		const activeIntervals: NodeJS.Timeout[] = [];

		afterEach(() => {
			activeIntervals.forEach(clearInterval);
			activeIntervals.length = 0;
		});

		const mockReadstream = (chunks: string[]) => {
			const mockedStream = new Stream.Readable();
			jest.spyOn(mockedStream, '_read').mockImplementation();

			const intervalHandle = setInterval(() => {
				if (chunks.length === 0) {
					clearInterval(intervalHandle);
					mockedStream.push(null);
				} else {
					mockedStream.push(chunks.shift());
				}
			}, 100);

			activeIntervals.push(intervalHandle);

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
					subscribe: jest.fn(),
					unsubscribe: jest.fn(),
					toAbortSignal: jest.fn().mockReturnValue(new AbortController().signal),
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

				mockedAxios.get
					.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
					.mockResolvedValueOnce({
						data: mockReadstream(['\xFF\xD8\xFF\xE0JFIF']),
						headers: { 'content-type': 'image/jpeg' },
					});

				const result = await service.tryExtractMetaTags(url);

				expect(result?.originalImageUrl).toEqual('https://example.com/rock.jpg');
			});

			it('should fetch the image', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const ogImages = [{ name: 'rock.jpg', width: 2000 }];

				mockedAxios.get
					.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
					.mockResolvedValueOnce({ data: mockReadstream(['\xFF\xD8\xFF\xE0JFIF']) });

				await service.tryExtractMetaTags(url);

				expect(mockedAxios.get).toHaveBeenNthCalledWith(
					2,
					'https://example.com/rock.jpg',
					expect.objectContaining({ responseType: 'stream' })
				);
			});

			it('should use request filtering agents for page and image requests', async () => {
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const ogImages = [{ name: 'rock.jpg', width: 2000 }];

				mockedAxios.get
					.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
					.mockResolvedValueOnce({ data: mockReadstream(['\xFF\xD8\xFF\xE0JFIF']) });

				await service.tryExtractMetaTags(url);

				const expectedAgents = expect.objectContaining({
					httpAgent: expect.any(RequestFilteringHttpAgent),
					httpsAgent: expect.any(RequestFilteringHttpsAgent),
				});
				expect(mockedAxios.get).toHaveBeenNthCalledWith(1, url.toString(), expectedAgents);
				expect(mockedAxios.get).toHaveBeenNthCalledWith(2, 'https://example.com/rock.jpg', expectedAgents);
			});

			describe('when the image url is not allowed', () => {
				const setup = (imageUrl: string) => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const title = 'Great Title';
					const html = `<html><head><title>${title}</title><meta property="og:image" content="${imageUrl}" /></head></html>`;

					mockedAxios.get.mockResolvedValueOnce({ data: mockReadstream([html]) });

					return { url, title };
				};

				it.each([
					['http scheme', 'http://example.com/rock.jpg'],
					['ftp scheme', 'ftp://example.com/rock.jpg'],
					['IPv4 address', 'https://127.0.0.1/rock.jpg'],
					['IPv6 address', 'https://[::1]/rock.jpg'],
				])('should not fetch the image and return no image for %s', async (_, imageUrl) => {
					const { url, title } = setup(imageUrl);

					const result = await service.tryExtractMetaTags(url);

					expect(result?.title).toEqual(title);
					expect(result?.originalImageUrl).toBeUndefined();
					expect(mockedAxios.get).toHaveBeenCalledTimes(1);
				});
			});

			describe('when the image is an svg', () => {
				const setup = (imageName: string, imageResponse: { chunks: string[]; contentType?: string }) => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const title = 'Great Title';
					const ogImages = [{ name: imageName, width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ title, ogImages })]) })
						.mockResolvedValueOnce({
							data: mockReadstream(imageResponse.chunks),
							headers: imageResponse.contentType ? { 'content-type': imageResponse.contentType } : {},
						});

					return { url, title };
				};

				describe('when the content is svg', () => {
					it('should return no image', async () => {
						const { url, title } = setup('image', {
							chunks: [
								'\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<!-- comment -->\n',
								'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg"></svg>',
							],
						});

						const result = await service.tryExtractMetaTags(url);

						expect(result?.title).toEqual(title);
						expect(result?.originalImageUrl).toBeUndefined();
					});
				});

				describe('when the content-type is image/svg+xml', () => {
					it('should return no image', async () => {
						const { url } = setup('image', {
							chunks: ['some content'],
							contentType: 'image/svg+xml; charset=utf-8',
						});

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
					});
				});

				describe('when the file extension is .svg', () => {
					it('should return no image', async () => {
						const { url } = setup('logo.SVG', { chunks: ['some content'] });

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
					});
				});
			});

			describe('when the image could not be fetched', () => {
				it('should return the meta data without image', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const title = 'Great Title';
					const ogImages = [{ name: 'rock.jpg', width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ title, ogImages })]) })
						.mockRejectedValueOnce({ response: { status: 404 } });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.title).toEqual(title);
					expect(result?.originalImageUrl).toBeUndefined();
				});
			});

			describe('when the image response is empty', () => {
				it('should keep the image', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [{ name: 'rock.jpg', width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream([]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/rock.jpg');
				});
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

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream(['\xFF\xD8\xFF\xE0JFIF']) });

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
