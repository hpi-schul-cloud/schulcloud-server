import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosError, AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { createServer, type Server } from 'node:http';
import { RequestFilteringHttpsAgent } from 'request-filtering-agent';
import { BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig } from '../../board-import.config';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, BoardImportSourceType } from '../type';
import {
	type BoardImportSourceRequest,
	BoardImportSourceHttpClientService,
} from './board-import-source-http-client.service';
import { BoardImportSourceService } from './board-import-source.service';

describe(BoardImportSourceHttpClientService.name, () => {
	let module: TestingModule;
	let service: BoardImportSourceHttpClientService;
	let axiosInstance: DeepMocked<AxiosInstance>;
	let sourceService: DeepMocked<BoardImportSourceService>;
	let config: BoardImportSourceRequestConfig;

	beforeAll(async () => {
		axiosInstance = createMock<AxiosInstance>();
		module = await Test.createTestingModule({
			providers: [
				BoardImportSourceHttpClientService,
				{ provide: HttpService, useValue: createMock<HttpService>({ axiosRef: axiosInstance }) },
				{ provide: BoardImportSourceService, useValue: createMock<BoardImportSourceService>() },
				{ provide: BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, useValue: new BoardImportSourceRequestConfig() },
			],
		}).compile();

		service = module.get(BoardImportSourceHttpClientService);
		sourceService = module.get(BoardImportSourceService);
		config = module.get(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupRequest = (props: Partial<BoardImportSourceRequest> = {}) => {
		const request: BoardImportSourceRequest = {
			method: 'POST',
			url: 'https://www.taskcards.de/graphql',
			headers: { 'x-token': 'visitor' },
			body: '{"query":"q"}',
			sourceType: BoardImportSourceType.TASKCARDS,
			signal: new AbortController().signal,
			...props,
		};
		sourceService.isLinkOfSource.mockReturnValue(true);

		return { request };
	};

	const mockResponse = (status: number, data = '', location?: string): void => {
		const headers = location === undefined ? {} : { location };
		axiosInstance.request.mockResolvedValueOnce(axiosResponseFactory.build({ status, data, headers }));
	};

	const getSentConfig = (call: number): AxiosRequestConfig => {
		const [sentConfig] = axiosInstance.request.mock.calls[call];

		return sentConfig;
	};

	const expectRejected = async (request: BoardImportSourceRequest, reason: BoardImportJobLogReason): Promise<void> => {
		const error = await service.request(request).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(BoardImportJobRejectedError);
		expect(error).toHaveProperty('reason', reason);
	};

	describe('request', () => {
		describe('when the source answers with status 200', () => {
			const setup = () => {
				const { request } = setupRequest();
				const body = '{"data":{}}';
				mockResponse(200, body);

				return { request, body };
			};

			it('should return the status and the body', async () => {
				const { request, body } = setup();

				const result = await service.request(request);

				expect(result).toEqual({ status: 200, body });
			});

			it('should check the URL for the source of the request', async () => {
				const { request } = setup();

				await service.request(request);

				expect(sourceService.isLinkOfSource).toHaveBeenCalledWith(request.url, request.sourceType);
			});

			it('should send the request with the limits and without automatic redirects or a proxy', async () => {
				const { request } = setup();

				await service.request(request);

				expect(getSentConfig(0)).toEqual(
					expect.objectContaining({
						method: request.method,
						url: request.url,
						headers: request.headers,
						data: request.body,
						maxRedirects: 0,
						proxy: false,
						responseType: 'text',
						timeout: config.requestTimeoutInSeconds * 1000,
						maxContentLength: config.maxResponseSizeInBytes,
						signal: request.signal,
					})
				);
			});

			it('should use the agent that rejects addresses that are not public', async () => {
				const { request } = setup();

				await service.request(request);

				expect(getSentConfig(0).httpsAgent).toBeInstanceOf(RequestFilteringHttpsAgent);
			});

			it('should accept each status', async () => {
				const { request } = setup();

				await service.request(request);

				const { validateStatus } = getSentConfig(0);
				expect(validateStatus?.(500)).toBe(true);
			});
		});

		describe('when the source answers with a status for a temporary error', () => {
			it.each([408, 429, 500, 503])('should throw an error that permits a new attempt for %s', async (status) => {
				const { request } = setupRequest();
				mockResponse(status, 'error');

				const error = await service.request(request).catch((e: unknown) => e);

				expect(error).toBeInstanceOf(Error);
				expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
			});
		});

		describe('when the source answers with another error status', () => {
			it.each([409, 404, 403])('should return the status %s and not throw', async (status: number) => {
				const { request } = setupRequest();
				mockResponse(status, 'error');

				const result = await service.request(request);

				expect(result).toEqual({ status, body: 'error' });
			});
		});

		describe('when the source redirects with status 302 to the same host', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockResponse(302, '', 'https://www.taskcards.de/other');
				mockResponse(200, 'final');

				return { request };
			};

			it('should return the answer of the redirect target', async () => {
				const { request } = setup();

				const result = await service.request(request);

				expect(result).toEqual({ status: 200, body: 'final' });
			});

			it('should check the redirect target', async () => {
				const { request } = setup();

				await service.request(request);

				expect(sourceService.isLinkOfSource).toHaveBeenCalledTimes(2);
				expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(
					'https://www.taskcards.de/other',
					request.sourceType
				);
			});

			it('should send a GET request without body and with the headers', async () => {
				const { request } = setup();

				await service.request(request);

				expect(getSentConfig(1)).toEqual(
					expect.objectContaining({
						method: 'GET',
						url: 'https://www.taskcards.de/other',
						headers: request.headers,
						data: undefined,
					})
				);
			});
		});

		describe('when the source redirects with status 307', () => {
			it('should keep the method and the body', async () => {
				const { request } = setupRequest();
				mockResponse(307, '', 'https://www.taskcards.de/other');
				mockResponse(200, 'final');

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ method: request.method, data: request.body }));
			});
		});

		describe('when the redirect target is a relative path', () => {
			it('should resolve it against the URL of the request', async () => {
				const { request } = setupRequest();
				mockResponse(308, '', '/other');
				mockResponse(200, 'final');

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ url: 'https://www.taskcards.de/other' }));
			});
		});

		describe('when the redirect target is another host of the source', () => {
			it('should not send the headers of the caller', async () => {
				const { request } = setupRequest();
				mockResponse(307, '', 'https://bra.taskcards.app/graphql');
				mockResponse(200, 'final');

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ headers: {} }));
			});
		});

		describe('when the URL of the request is not a link of the source', () => {
			it('should reject the request and send nothing', async () => {
				const { request } = setupRequest();
				sourceService.isLinkOfSource.mockReset();
				sourceService.isLinkOfSource.mockReturnValueOnce(false);

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

				expect(axiosInstance.request).not.toHaveBeenCalled();
			});
		});

		describe('when the redirect target is not a link of the source', () => {
			it.each(['https://169.254.169.254/', 'http://www.taskcards.de/', 'https://evil.example/', 'https://api-svc/'])(
				'should reject the redirect to "%s" and send no second request',
				async (location: string) => {
					const { request } = setupRequest();
					sourceService.isLinkOfSource.mockReset();
					sourceService.isLinkOfSource.mockReturnValueOnce(true);
					sourceService.isLinkOfSource.mockReturnValueOnce(false);
					mockResponse(302, '', location);

					await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

					expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(location, request.sourceType);
					expect(axiosInstance.request).toHaveBeenCalledTimes(1);
				}
			);
		});

		describe('when the agent rejects an address of the host', () => {
			it('should reject the request', async () => {
				const { request } = setupRequest();
				axiosInstance.request.mockRejectedValueOnce(
					new AxiosError(
						'DNS lookup 10.0.0.5(family:4, host:www.taskcards.de) is not allowed. Because, It is private IP address.'
					)
				);

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			});
		});

		describe('when the redirect target is not a URL', () => {
			it('should reject the request', async () => {
				const { request } = setupRequest();
				mockResponse(302, '', 'https://');

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			});
		});

		describe('when a redirect status has no location', () => {
			it('should return the answer', async () => {
				const { request } = setupRequest();
				mockResponse(302, 'no location');

				const result = await service.request(request);

				expect(result).toEqual({ status: 302, body: 'no location' });
			});
		});

		describe('when the source redirects more often than permitted', () => {
			it('should reject the request after the permitted redirects', async () => {
				const { request } = setupRequest();
				for (let i = 0; i <= config.maxRedirects; i += 1) {
					mockResponse(302, '', '/again');
				}

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

				expect(axiosInstance.request).toHaveBeenCalledTimes(config.maxRedirects + 1);
			});
		});

		describe('when the answer is larger than the limit', () => {
			it('should reject the request', async () => {
				const { request } = setupRequest();
				axiosInstance.request.mockRejectedValueOnce(
					new AxiosError('maxContentLength size of 10485760 exceeded', AxiosError.ERR_BAD_RESPONSE)
				);

				await expectRejected(request, BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
			});
		});

		describe('when the request fails with a network error or a timeout', () => {
			it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT, 'ECONNRESET'])(
				'should throw an error without the URL for the code %s',
				async (code: string) => {
					const { request } = setupRequest();
					axiosInstance.request.mockRejectedValueOnce(
						new AxiosError(`failed for ${request.url}`, code, { url: request.url, headers: new AxiosHeaders() })
					);

					const error = await service.request(request).catch((e: unknown) => e);

					expect(error).toBeInstanceOf(Error);
					expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
					expect(error).not.toBeInstanceOf(AxiosError);
					expect(error).toEqual(expect.objectContaining({ message: expect.not.stringContaining('taskcards') }));
					expect(error).not.toHaveProperty('cause');
				}
			);
		});

		describe('when the signal is aborted', () => {
			it('should throw before the first request', async () => {
				const abortController = new AbortController();
				abortController.abort();
				const { request } = setupRequest({ signal: abortController.signal });

				await expect(service.request(request)).rejects.toThrow();

				expect(sourceService.isLinkOfSource).not.toHaveBeenCalled();
				expect(axiosInstance.request).not.toHaveBeenCalled();
			});
		});
	});
});

describe(`${BoardImportSourceHttpClientService.name} with real requests`, () => {
	let module: TestingModule;
	let service: BoardImportSourceHttpClientService;
	let sourceService: DeepMocked<BoardImportSourceService>;
	let config: BoardImportSourceRequestConfig;
	let server: Server;
	let serverUrl: string;

	const largeBody = 'a'.repeat(100000);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportSourceHttpClientService,
				{ provide: HttpService, useValue: new HttpService() },
				{ provide: BoardImportSourceService, useValue: createMock<BoardImportSourceService>() },
				{ provide: BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, useValue: new BoardImportSourceRequestConfig() },
			],
		}).compile();

		service = module.get(BoardImportSourceHttpClientService);
		sourceService = module.get(BoardImportSourceService);
		config = module.get(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN);

		server = createServer((request, response) => {
			if (request.url === '/redirect') {
				response.writeHead(302, { location: '/final' }).end();
			} else if (request.url === '/large') {
				response.writeHead(200).end(largeBody);
			} else {
				response.writeHead(200).end(`${request.method ?? ''} ${request.url ?? ''}`);
			}
		});
		await new Promise<void>((resolve) => {
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		const port = typeof address === 'object' && address !== null ? address.port : 0;
		serverUrl = `http://127.0.0.1:${port}`;
	});

	afterAll(async () => {
		await new Promise((resolve) => {
			server.close(resolve);
		});
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		config.maxResponseSizeInBytes = new BoardImportSourceRequestConfig().maxResponseSizeInBytes;
	});

	const setup = (url: string) => {
		const request: BoardImportSourceRequest = {
			method: 'POST',
			url,
			body: '{}',
			sourceType: BoardImportSourceType.TASKCARDS,
			signal: new AbortController().signal,
		};
		sourceService.isLinkOfSource.mockReturnValue(true);

		return { request };
	};

	describe('when the host of an https URL resolves to an address that is not public', () => {
		it('should reject the request', async () => {
			const { request } = setup('https://localhost/graphql');

			const error = await service.request(request).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(BoardImportJobRejectedError);
			expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		});
	});

	describe('when the answer is larger than the limit', () => {
		it('should reject the request', async () => {
			const { request } = setup(`${serverUrl}/large`);
			config.maxResponseSizeInBytes = 1000;

			const error = await service.request(request).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(BoardImportJobRejectedError);
			expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
		});
	});

	describe('when the server redirects', () => {
		it('should follow the redirect itself and return the answer of the target', async () => {
			const { request } = setup(`${serverUrl}/redirect`);

			const result = await service.request(request);

			expect(result).toEqual({ status: 200, body: 'GET /final' });
			expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(`${serverUrl}/final`, request.sourceType);
		});
	});
});
