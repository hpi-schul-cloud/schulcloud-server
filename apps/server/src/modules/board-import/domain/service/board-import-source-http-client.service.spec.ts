import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosError, AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { Agent } from 'node:https';
import { BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, BoardImportSourceRequestConfig } from '../../board-import.config';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, BoardImportSourceType } from '../type';
import { BoardImportLinkCheckService } from './board-import-link-check.service';
import {
	type BoardImportSourceRequest,
	BoardImportSourceHttpClientService,
} from './board-import-source-http-client.service';

describe(BoardImportSourceHttpClientService.name, () => {
	let module: TestingModule;
	let service: BoardImportSourceHttpClientService;
	let axiosInstance: DeepMocked<AxiosInstance>;
	let linkCheckService: DeepMocked<BoardImportLinkCheckService>;
	let config: BoardImportSourceRequestConfig;

	beforeAll(async () => {
		axiosInstance = createMock<AxiosInstance>();
		module = await Test.createTestingModule({
			providers: [
				BoardImportSourceHttpClientService,
				{ provide: HttpService, useValue: createMock<HttpService>({ axiosRef: axiosInstance }) },
				{ provide: BoardImportLinkCheckService, useValue: createMock<BoardImportLinkCheckService>() },
				{ provide: BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN, useValue: new BoardImportSourceRequestConfig() },
			],
		}).compile();

		service = module.get(BoardImportSourceHttpClientService);
		linkCheckService = module.get(BoardImportLinkCheckService);
		config = module.get(BOARD_IMPORT_SOURCE_REQUEST_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupRequest = (props: Partial<BoardImportSourceRequest> = {}) => {
		const checkedAddress = { address: '93.184.216.34', family: 4 as const };
		const request: BoardImportSourceRequest = {
			method: 'POST',
			url: 'https://www.taskcards.de/graphql',
			headers: { 'x-token': 'visitor' },
			body: '{"query":"q"}',
			sourceType: BoardImportSourceType.TASKCARDS,
			signal: new AbortController().signal,
			...props,
		};
		linkCheckService.check.mockResolvedValue(checkedAddress);

		return { request, checkedAddress };
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
				const { request, checkedAddress } = setupRequest();
				const body = '{"data":{}}';
				mockResponse(200, body);

				return { request, checkedAddress, body };
			};

			it('should return the status and the body', async () => {
				const { request, body } = setup();

				const result = await service.request(request);

				expect(result).toEqual({ status: 200, body });
			});

			it('should check the URL for the source of the request', async () => {
				const { request } = setup();

				await service.request(request);

				expect(linkCheckService.check).toHaveBeenCalledWith(new URL(request.url), request.sourceType);
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

			it('should connect to the checked address', async () => {
				const { request, checkedAddress } = setup();
				const callback = jest.fn();

				await service.request(request);

				const agent: unknown = getSentConfig(0).httpsAgent;
				expect(agent).toBeInstanceOf(Agent);
				if (agent instanceof Agent) {
					agent.options.lookup?.('www.taskcards.de', { all: true }, callback);
				}
				expect(callback).toHaveBeenCalledWith(null, [checkedAddress]);
			});

			it('should accept each status', async () => {
				const { request } = setup();

				await service.request(request);

				const { validateStatus } = getSentConfig(0);
				expect(validateStatus?.(500)).toBe(true);
			});
		});

		describe('when the source answers with an error status', () => {
			it.each([409, 404, 500])('should return the status %s and not throw', async (status: number) => {
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

				expect(linkCheckService.check).toHaveBeenCalledTimes(2);
				expect(linkCheckService.check).toHaveBeenLastCalledWith(
					new URL('https://www.taskcards.de/other'),
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

		describe('when the check rejects the redirect target', () => {
			it.each(['https://169.254.169.254/', 'http://www.taskcards.de/', 'https://evil.example/', 'https://api-svc/'])(
				'should reject the redirect to "%s" and send no second request',
				async (location: string) => {
					const { request, checkedAddress } = setupRequest();
					linkCheckService.check.mockReset();
					linkCheckService.check.mockResolvedValueOnce(checkedAddress);
					linkCheckService.check.mockRejectedValueOnce(
						new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED)
					);
					mockResponse(302, '', location);

					await expectRejected(request, BoardImportJobLogReason.SOURCE_LINK_REJECTED);

					expect(linkCheckService.check).toHaveBeenLastCalledWith(new URL(location), request.sourceType);
					expect(axiosInstance.request).toHaveBeenCalledTimes(1);
				}
			);
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

				expect(linkCheckService.check).not.toHaveBeenCalled();
				expect(axiosInstance.request).not.toHaveBeenCalled();
			});
		});
	});
});
