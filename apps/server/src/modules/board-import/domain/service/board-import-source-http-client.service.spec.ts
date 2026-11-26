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

		return { request };
	};

	const mockLinkChecks = (...results: boolean[]): void => {
		results.forEach((result) => sourceService.isLinkOfSource.mockReturnValueOnce(result));
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
				const status = 200;
				const body = '{"data":{}}';
				mockLinkChecks(true);
				mockResponse(status, body);

				return { request, status, body };
			};

			it('should return the status and the body', async () => {
				const { request, status, body } = setup();

				const result = await service.request(request);

				expect(result).toEqual({ status, body });
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
						signal: expect.any(AbortSignal),
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
			const setup = (status: number) => {
				const { request } = setupRequest();
				mockLinkChecks(true);
				mockResponse(status, 'error');

				return { request };
			};

			it.each([408, 429, 500, 503])('should throw an error that permits a new attempt for %s', async (status) => {
				const { request } = setup(status);

				const error = await service.request(request).catch((e: unknown) => e);

				expect(error).toBeInstanceOf(Error);
				expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
			});
		});

		describe('when the source answers with another error status', () => {
			const setup = (status: number) => {
				const { request } = setupRequest();
				const body = 'error';
				mockLinkChecks(true);
				mockResponse(status, body);

				return { request, body };
			};

			it.each([409, 404, 403])('should return the status %s and not throw', async (status: number) => {
				const { request, body } = setup(status);

				const result = await service.request(request);

				expect(result).toEqual({ status, body });
			});
		});

		describe('when the source redirects with status 302 to the same host', () => {
			const setup = () => {
				const { request } = setupRequest();
				const location = 'https://www.taskcards.de/other';
				const finalResponse = { status: 200, body: 'final' };
				mockLinkChecks(true, true);
				mockResponse(302, '', location);
				mockResponse(finalResponse.status, finalResponse.body);

				return { request, location, finalResponse };
			};

			it('should return the answer of the redirect target', async () => {
				const { request, finalResponse } = setup();

				const result = await service.request(request);

				expect(result).toEqual(finalResponse);
			});

			it('should check the redirect target', async () => {
				const { request, location } = setup();

				await service.request(request);

				expect(sourceService.isLinkOfSource).toHaveBeenCalledTimes(2);
				expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(location, request.sourceType);
			});

			it('should send a GET request without body and with the headers', async () => {
				const { request, location } = setup();

				await service.request(request);

				expect(getSentConfig(1)).toEqual(
					expect.objectContaining({
						method: 'GET',
						url: location,
						headers: request.headers,
						data: undefined,
					})
				);
			});
		});

		describe('when the source redirects with status 307', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(true, true);
				mockResponse(307, '', 'https://www.taskcards.de/other');
				mockResponse(200, 'final');

				return { request };
			};

			it('should keep the method and the body', async () => {
				const { request } = setup();

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ method: request.method, data: request.body }));
			});
		});

		describe('when the redirect target is a relative path', () => {
			const setup = () => {
				const { request } = setupRequest();
				const resolvedUrl = 'https://www.taskcards.de/other';
				mockLinkChecks(true, true);
				mockResponse(308, '', '/other');
				mockResponse(200, 'final');

				return { request, resolvedUrl };
			};

			it('should resolve it against the URL of the request', async () => {
				const { request, resolvedUrl } = setup();

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ url: resolvedUrl }));
			});
		});

		describe('when the redirect target is another host of the source', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(true, true);
				mockResponse(307, '', 'https://bra.taskcards.app/graphql');
				mockResponse(200, 'final');

				return { request };
			};

			it('should not send the headers of the caller', async () => {
				const { request } = setup();

				await service.request(request);

				expect(getSentConfig(1)).toEqual(expect.objectContaining({ headers: {} }));
			});
		});

		describe('when the URL of the request is not a link of the source', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(false);

				return { request };
			};

			it('should reject the request and send nothing', async () => {
				const { request } = setup();

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

				expect(axiosInstance.request).not.toHaveBeenCalled();
			});
		});

		describe('when the redirect target is not a link of the source', () => {
			const setup = (location: string) => {
				const { request } = setupRequest();
				mockLinkChecks(true, false);
				mockResponse(302, '', location);

				return { request };
			};

			it.each(['https://169.254.169.254/', 'http://www.taskcards.de/', 'https://evil.example/', 'https://api-svc/'])(
				'should reject the redirect to "%s" and send no second request',
				async (location: string) => {
					const { request } = setup(location);

					await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

					expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(location, request.sourceType);
					expect(axiosInstance.request).toHaveBeenCalledTimes(1);
				}
			);
		});

		describe('when the agent rejects an address of the host', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(true);
				axiosInstance.request.mockRejectedValueOnce(
					new AxiosError(
						'DNS lookup 10.0.0.5(family:4, host:www.taskcards.de) is not allowed. Because, It is private IP address.'
					)
				);

				return { request };
			};

			it('should reject the request', async () => {
				const { request } = setup();

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			});
		});

		describe('when the redirect target is not a URL', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(true);
				mockResponse(302, '', 'https://');

				return { request };
			};

			it('should reject the request', async () => {
				const { request } = setup();

				await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			});
		});

		describe('when a redirect status has no location', () => {
			const setup = () => {
				const { request } = setupRequest();
				const response = { status: 302, body: 'no location' };
				mockLinkChecks(true);
				mockResponse(response.status, response.body);

				return { request, response };
			};

			it('should return the answer', async () => {
				const { request, response } = setup();

				const result = await service.request(request);

				expect(result).toEqual(response);
			});
		});

		describe('when the source redirects more often than permitted', () => {
			const setup = () => {
				const { request } = setupRequest();
				const requestCount = config.maxRedirects + 1;
				mockLinkChecks(...Array<boolean>(requestCount).fill(true));
				for (let i = 0; i < requestCount; i += 1) {
					mockResponse(302, '', '/again');
				}

				return { request, requestCount };
			};

			it('should reject the request after the permitted redirects', async () => {
				const { request, requestCount } = setup();

				await expectRejected(request, BoardImportJobLogReason.SOURCE_TOO_MANY_REDIRECTS);

				expect(axiosInstance.request).toHaveBeenCalledTimes(requestCount);
			});
		});

		describe('when the answer is larger than the limit', () => {
			const setup = () => {
				const { request } = setupRequest();
				mockLinkChecks(true);
				axiosInstance.request.mockRejectedValueOnce(
					new AxiosError('maxContentLength size of 10485760 exceeded', AxiosError.ERR_BAD_RESPONSE)
				);

				return { request };
			};

			it('should reject the request', async () => {
				const { request } = setup();

				await expectRejected(request, BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
			});
		});

		describe('when the request fails with a network error or a timeout', () => {
			const setup = (code: string) => {
				const { request } = setupRequest();
				mockLinkChecks(true);
				axiosInstance.request.mockRejectedValueOnce(
					new AxiosError(`failed for ${request.url}`, code, { url: request.url, headers: new AxiosHeaders() })
				);

				return { request };
			};

			it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT, 'ECONNRESET'])(
				'should throw an error without the URL for the code %s',
				async (code: string) => {
					const { request } = setup(code);

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
			const setup = () => {
				const abortController = new AbortController();
				abortController.abort();
				const { request } = setupRequest({ signal: abortController.signal });

				return { request };
			};

			it('should throw before the first request', async () => {
				const { request } = setup();

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
			} else if (request.url === '/slow') {
				response.writeHead(200);
				const interval = setInterval(() => response.write('a'), 100);
				response.on('close', () => clearInterval(interval));
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
		config.requestTimeoutInSeconds = new BoardImportSourceRequestConfig().requestTimeoutInSeconds;
	});

	const setupRequest = (url: string, linkCheckCount = 1) => {
		const request: BoardImportSourceRequest = {
			method: 'POST',
			url,
			body: '{}',
			sourceType: BoardImportSourceType.TASKCARDS,
			signal: new AbortController().signal,
		};
		for (let i = 0; i < linkCheckCount; i += 1) {
			sourceService.isLinkOfSource.mockReturnValueOnce(true);
		}

		return { request };
	};

	describe('when the host of an https URL resolves to an address that is not public', () => {
		const setup = () => {
			const { request } = setupRequest('https://localhost/graphql');

			return { request };
		};

		it('should reject the request', async () => {
			const { request } = setup();

			const error = await service.request(request).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(BoardImportJobRejectedError);
			expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		});
	});

	describe('when the answer is larger than the limit', () => {
		const setup = () => {
			const { request } = setupRequest(`${serverUrl}/large`);
			config.maxResponseSizeInBytes = 1000;

			return { request };
		};

		it('should reject the request', async () => {
			const { request } = setup();

			const error = await service.request(request).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(BoardImportJobRejectedError);
			expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_RESPONSE_TOO_LARGE);
		});
	});

	describe('when the server sends the answer slowly and without end', () => {
		const setup = () => {
			const { request } = setupRequest(`${serverUrl}/slow`);
			config.requestTimeoutInSeconds = 1;

			return { request };
		};

		it('should stop the request at the time limit with an error that permits a new attempt', async () => {
			const { request } = setup();

			const error = await service.request(request).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(Error);
			expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
		});
	});

	describe('when the server redirects', () => {
		const setup = () => {
			const { request } = setupRequest(`${serverUrl}/redirect`, 2);
			const targetUrl = `${serverUrl}/final`;
			const expectedResult = { status: 200, body: 'GET /final' };

			return { request, targetUrl, expectedResult };
		};

		it('should follow the redirect itself and return the answer of the target', async () => {
			const { request, targetUrl, expectedResult } = setup();

			const result = await service.request(request);

			expect(result).toEqual(expectedResult);
			expect(sourceService.isLinkOfSource).toHaveBeenLastCalledWith(targetUrl, request.sourceType);
		});
	});
});
