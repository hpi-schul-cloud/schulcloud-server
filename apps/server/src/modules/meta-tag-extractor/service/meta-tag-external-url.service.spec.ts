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

		const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

		const mockReadstream = (chunks: (string | Buffer)[]) => {
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
						data: mockReadstream([jpegBytes]),
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
					.mockResolvedValueOnce({ data: mockReadstream([jpegBytes]) });

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
					.mockResolvedValueOnce({ data: mockReadstream([jpegBytes]) });

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
				const setup = (imageName: string, imageResponse: { chunks: (string | Buffer)[]; contentType?: string }) => {
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
					it.each([
						[
							'with preamble',
							'\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<!-- comment -->\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg"></svg>',
						],
						['with namespaced root', '<s:svg xmlns:s="http://www.w3.org/2000/svg"></s:svg>'],
						[
							'with processing instruction before root',
							'<?xml-stylesheet href="style.css"?><svg xmlns="http://www.w3.org/2000/svg"></svg>',
						],
						['with comment longer than the sample', `<!--${'a'.repeat(20000)}--><svg></svg>`],
					])('should return no image %s', async (_, svg) => {
						const { url, title } = setup('image', { chunks: [svg] });

						const result = await service.tryExtractMetaTags(url);

						expect(result?.title).toEqual(title);
						expect(result?.originalImageUrl).toBeUndefined();
					});
				});

				describe('when the content-type is image/svg+xml', () => {
					it('should return no image', async () => {
						const { url } = setup('image', {
							chunks: [jpegBytes],
							contentType: 'image/svg+xml; charset=utf-8',
						});

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
					});
				});

				describe('when the file extension is .svg', () => {
					it('should return no image', async () => {
						const { url } = setup('logo.SVG', { chunks: [jpegBytes] });

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
					});
				});

				describe('when the response is empty', () => {
					it.each([
						['the file extension is .svg', 'logo.svg', undefined],
						['the content-type is image/svg+xml', 'image', 'image/svg+xml'],
					])('should return no image if %s', async (_, imageName, contentType) => {
						const { url } = setup(imageName, { chunks: [], contentType });

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
					});
				});
			});

			describe('when the image format is checked by its content', () => {
				const setup = (imageBytes: Buffer) => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [{ name: 'image', width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream([imageBytes]) });

					return { url };
				};

				it.each([
					['jpeg', jpegBytes],
					['png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
					['gif87a', Buffer.from('GIF87a...')],
					['gif89a', Buffer.from('GIF89a...')],
					['webp', Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ')],
					['avif', Buffer.from('\x00\x00\x00\x1cftypavif')],
				])('should return the image for %s', async (_, imageBytes) => {
					const { url } = setup(imageBytes);

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/image');
				});

				it.each([
					['unknown binary', Buffer.from([0x00, 0x01, 0x02, 0x03])],
					['html', Buffer.from('<!DOCTYPE html><html></html>')],
					['truncated png signature', Buffer.from([0x89, 0x50, 0x4e])],
				])('should return no image for %s', async (_, imageBytes) => {
					const { url } = setup(imageBytes);

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toBeUndefined();
				});

				describe('when the content is an ISO-BMFF ftyp box', () => {
					const ftypBox = ({
						majorBrand,
						minorVersion = '\x00\x00\x00\x00',
						compatibleBrands = [],
						declaredSize,
					}: {
						majorBrand: string;
						minorVersion?: string;
						compatibleBrands?: string[];
						declaredSize?: number;
					}): Buffer => {
						const body = Buffer.from(`ftyp${majorBrand}${minorVersion}${compatibleBrands.join('')}`, 'latin1');
						const size = Buffer.alloc(4);
						size.writeUInt32BE(declaredSize ?? body.length + 4);
						return Buffer.concat([size, body]);
					};

					it.each([
						['major brand avif', ftypBox({ majorBrand: 'avif' })],
						['major brand avis', ftypBox({ majorBrand: 'avis' })],
						['compatible brand avif', ftypBox({ majorBrand: 'mif1', compatibleBrands: ['miaf', 'avif'] })],
						['compatible brand avis', ftypBox({ majorBrand: 'msf1', compatibleBrands: ['avis'] })],
						[
							'declared box size larger than the received content',
							ftypBox({ majorBrand: 'avif', declaredSize: 0x10000 }),
						],
					])('should return the image for %s', async (_, imageBytes) => {
						const { url } = setup(imageBytes);

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toEqual('https://example.com/image');
					});

					it.each([
						['heic brands only', ftypBox({ majorBrand: 'heic', compatibleBrands: ['mif1', 'heic'] })],
						['mp4 brands only', ftypBox({ majorBrand: 'isom', compatibleBrands: ['iso2', 'mp41'] })],
						['avif only as minor version', ftypBox({ majorBrand: 'mif1', minorVersion: 'avif' })],
						[
							'avif outside the declared box size',
							ftypBox({ majorBrand: 'mif1', compatibleBrands: ['miaf', 'avif'], declaredSize: 20 }),
						],
						[
							'avif beyond the sampled 64 bytes',
							ftypBox({ majorBrand: 'mif1', compatibleBrands: [...Array<string>(12).fill('miaf'), 'avif'] }),
						],
						['truncated compatible brand', ftypBox({ majorBrand: 'mif1', compatibleBrands: ['av'], declaredSize: 24 })],
						['avif brand without ftyp box', Buffer.from('\x00\x00\x00\x18moovavif', 'latin1')],
					])('should return no image for %s', async (_, imageBytes) => {
						const { url } = setup(imageBytes);

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

			describe('when the image server stalls', () => {
				const setup = (imageResponse: Promise<unknown>) => {
					jest.useFakeTimers();
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const title = 'Great Title';
					const description = 'Great Description';
					const ogImages = [{ name: 'rock.jpg', width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ title, description, ogImages })]) })
						.mockReturnValueOnce(imageResponse);

					return { url, title, description, cancelTokenSource };
				};

				afterEach(() => {
					jest.useRealTimers();
				});

				const createStalledStream = () => {
					const stalledStream = new Stream.Readable({ read: () => {} });
					stalledStream.push(jpegBytes);
					return stalledStream;
				};

				it.each([
					['while streaming the body', () => Promise.resolve({ data: createStalledStream() })],
					['while connecting', () => new Promise(() => {})],
				])('should cancel the image request and return the meta data without image %s', async (_, response) => {
					const { url, title, description, cancelTokenSource } = setup(response());

					const resultPromise = service.tryExtractMetaTags(url);
					await jest.advanceTimersByTimeAsync(20000);
					const result = await resultPromise;

					expect(result?.title).toEqual(title);
					expect(result?.description).toEqual(description);
					expect(result?.originalImageUrl).toBeUndefined();
					expect(cancelTokenSource.cancel).toHaveBeenCalledWith('Request canceled after 10000 ms.');
				});
			});

			describe('when the image response is empty', () => {
				it('should return no image', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [{ name: 'rock.jpg', width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream([]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toBeUndefined();
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
						.mockResolvedValueOnce({ data: mockReadstream([jpegBytes]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/paper.jpg');
				});

				it('should skip images with unsupported file extensions', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [
						{ name: 'logo.svg', width: 500 },
						{ name: 'banner.bmp', width: 600 },
						{ name: 'document.pdf', width: 700 },
						{ name: 'rock.jpg', width: 2000 },
					];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream([jpegBytes]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/rock.jpg');
					expect(mockedAxios.get).toHaveBeenNthCalledWith(2, 'https://example.com/rock.jpg', expect.anything());
				});
			});

			describe('when images have no width', () => {
				it('should fall back to the first image with supported file extension', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const html = `<html><head>
						<meta property="og:image" content="https://example.com/logo.svg" />
						<meta property="og:image" content="https://example.com/photo.png" />
					</head></html>`;

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([html]) })
						.mockResolvedValueOnce({ data: mockReadstream([jpegBytes]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toEqual('https://example.com/photo.png');
				});
			});

			describe('when the image url is malformed', () => {
				it('should return the meta data without image', async () => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const title = 'Great Title';
					const html = `<html><head><title>${title}</title><meta property="og:image" content="https://[invalid/photo.png" /></head></html>`;

					mockedAxios.get.mockResolvedValueOnce({ data: mockReadstream([html]) });

					const result = await service.tryExtractMetaTags(url);

					expect(result?.title).toEqual(title);
					expect(result?.originalImageUrl).toBeUndefined();
				});
			});

			describe('when checking the file extension of the image url', () => {
				const setup = (imageName: string, imageBytes: Buffer | string = jpegBytes) => {
					const url = new URL('https://de.wikipedia.org/example-article');

					const cancelTokenSource = createCancelTokenSource();
					jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

					const ogImages = [{ name: imageName, width: 2000 }];

					mockedAxios.get
						.mockResolvedValueOnce({ data: mockReadstream([mockHtmlStart({ ogImages })]) })
						.mockResolvedValueOnce({ data: mockReadstream([imageBytes]) });

					return { url };
				};

				it.each(['photo.JPEG', 'photo.png?size=large', 'photo.webp#preview', 'photo.gif', 'photo.avif', 'image'])(
					'should keep %s',
					async (imageName) => {
						const { url } = setup(imageName);

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toEqual(`https://example.com/${imageName}`);
					}
				);

				describe('when the image is served by a dynamic image generator', () => {
					it.each([
						'thumb.php?src=photo',
						'legacy/image.asp?id=1',
						'GetImage.aspx?id=1',
						'ImageHandler.ashx?id=1',
						'image.jsp?id=1',
						'showImage.do?id=1',
						'image.action?id=1',
						'image.CFM?id=1',
						'cgi-bin/thumb.cgi?id=1',
						'cgi-bin/thumb.pl?id=1',
					])('should fetch and keep %s if it returns a raster image', async (imageName) => {
						const { url } = setup(imageName);

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toEqual(`https://example.com/${imageName}`);
						expect(mockedAxios.get).toHaveBeenNthCalledWith(2, `https://example.com/${imageName}`, expect.anything());
					});

					it('should drop the image if it returns an svg', async () => {
						const { url } = setup('thumb.php?src=logo', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

						const result = await service.tryExtractMetaTags(url);

						expect(result?.originalImageUrl).toBeUndefined();
						expect(mockedAxios.get).toHaveBeenCalledTimes(2);
					});
				});

				it.each([
					'logo.svg',
					'logo.svgz',
					'icon.ico',
					'image.bmp',
					'photo.heic',
					'image.jpg.svg',
					'chart.axd?id=1',
					'document.pdf',
					'page.html',
					'image.php.svg',
				])('should drop %s without fetching it', async (imageName) => {
					const { url } = setup(imageName);

					const result = await service.tryExtractMetaTags(url);

					expect(result?.originalImageUrl).toBeUndefined();
					expect(mockedAxios.get).toHaveBeenCalledTimes(1);
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

		describe('when the page server stalls', () => {
			afterEach(() => {
				jest.useRealTimers();
			});

			it('should cancel the request and return undefined', async () => {
				jest.useFakeTimers();
				const url = new URL('https://de.wikipedia.org/example-article');

				const cancelTokenSource = createCancelTokenSource();
				jest.spyOn(axios.CancelToken, 'source').mockReturnValue(cancelTokenSource);

				const stalledStream = new Stream.Readable({ read: () => {} });
				stalledStream.push(mockHtmlStart());
				mockedAxios.get.mockResolvedValueOnce({ data: stalledStream });

				const resultPromise = service.tryExtractMetaTags(url);
				await jest.advanceTimersByTimeAsync(10000);
				const result = await resultPromise;

				expect(result).toBeUndefined();
				expect(cancelTokenSource.cancel).toHaveBeenCalledWith('Request canceled after 10000 ms.');
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
