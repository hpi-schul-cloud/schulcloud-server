import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { DeletionRequestInputBuilder, DeletionRequestOutputBuilder } from '.';
import { DeletionConsoleConfig } from '../deletion.config';
import { DeletionClient } from './deletion.client';
import { DeletionRequestOutput } from './interface';
import { ObjectId } from '@mikro-orm/mongodb';

describe(DeletionClient.name, () => {
	let module: TestingModule;
	let client: DeletionClient;
	let configService: DeepMocked<ConfigService>;
	let httpService: DeepMocked<HttpService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<DeletionConsoleConfig, true>>(),
				},
				DeletionClient,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		client = module.get(DeletionClient);
		configService = module.get(ConfigService);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setupConfig = () => {
		// Please take a look that the order is correct if the code order is changed
		configService.get.mockImplementation((key: string) => {
			if (key === 'ADMIN_API_CLIENT_API_KEY') {
				return '652559c2-93da-42ad-94e1-640e3afbaca0';
			}
			if (key === 'ADMIN_API_CLIENT_BASE_URL') {
				return 'http://api-admin:4030';
			}
			return undefined;
		});
	};

	describe('queueDeletionRequest', () => {
		describe('when sending the HTTP request failed', () => {
			const setup = () => {
				setupConfig();
				const input = DeletionRequestInputBuilder.build('user', '652f1625e9bc1a13bdaae48b');

				const error = new Error('unknown error');
				httpService.post.mockReturnValueOnce(throwError(() => error));

				return { input };
			};

			it('should catch and throw an error', async () => {
				const { input } = setup();

				await expect(client.queueDeletionRequest(input)).rejects.toThrow(Error);
			});
		});

		describe('when received valid response with expected HTTP status code', () => {
			const setup = () => {
				setupConfig();
				const input = DeletionRequestInputBuilder.build('user', '652f1625e9bc1a13bdaae48b');

				const output: DeletionRequestOutput = DeletionRequestOutputBuilder.build(
					'6536ce29b595d7c8e5faf200',
					new Date('2024-10-15T12:42:50.521Z')
				);

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					data: output,
					status: 202,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { input, output };
			};

			it('should return proper output', async () => {
				const { input, output } = setup();

				const result = await client.queueDeletionRequest(input);

				expect(result).toEqual(output);
			});
		});

		describe('when received invalid HTTP status code in a response', () => {
			const setup = () => {
				setupConfig();
				const input = DeletionRequestInputBuilder.build('user', '652f1625e9bc1a13bdaae48b');

				const output: DeletionRequestOutput = DeletionRequestOutputBuilder.build('', new Date());

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					data: output,
					status: 200,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { input };
			};

			it('should throw an exception', async () => {
				const { input } = setup();

				await expect(client.queueDeletionRequest(input)).rejects.toThrow(Error);
			});
		});

		describe('when received no requestId in a response', () => {
			const setup = () => {
				setupConfig();
				const input = DeletionRequestInputBuilder.build('user', '652f1625e9bc1a13bdaae48b');

				const output: DeletionRequestOutput = DeletionRequestOutputBuilder.build(
					'',
					new Date('2024-10-15T12:42:50.521Z')
				);

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					data: output,
					status: 202,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { input };
			};

			it('should throw an exception', async () => {
				const { input } = setup();

				await expect(client.queueDeletionRequest(input)).rejects.toThrow(Error);
			});
		});

		describe('when received no deletionPlannedAt in a response', () => {
			const setup = () => {
				setupConfig();
				const input = DeletionRequestInputBuilder.build('user', '652f1625e9bc1a13bdaae48b');

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					data: {
						requestId: '6536ce29b595d7c8e5faf200',
					},
					status: 202,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { input };
			};

			it('should throw an exception', async () => {
				const { input } = setup();

				await expect(client.queueDeletionRequest(input)).rejects.toThrow(Error);
			});
		});
	});

	describe('executeDeletions', () => {
		const mockGetRequestIds = () => {
			const getResponse1: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
				status: 200,
				data: [new ObjectId().toHexString()],
			});
			const getResponse2: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
				status: 200,
				data: [],
			});
			httpService.get.mockReturnValueOnce(of(getResponse1)).mockReturnValueOnce(of(getResponse2));
		};

		describe('when sending the HTTP request failed', () => {
			const setup = () => {
				setupConfig();
				mockGetRequestIds();
				const error = new Error('unknown error');

				httpService.post.mockReturnValueOnce(throwError(() => error));
			};

			it('should catch and throw an error', async () => {
				setup();

				await expect(client.executeDeletions()).rejects.toThrow(Error);
			});
		});

		describe('when received valid response with expected HTTP status code', () => {
			const setup = () => {
				setupConfig();
				mockGetRequestIds();
				const limit = 10;

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					status: 204,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { limit };
			};

			// @fixme
			it('should return proper output', async () => {
				const { limit } = setup();

				await expect(client.executeDeletions(limit)).resolves.not.toThrow();
			});
		});

		describe('when pass invalid limit', () => {
			const setup = () => {
				setupConfig();
				mockGetRequestIds();
				const limit = true;

				const postResponse: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					status: 204,
				});
				httpService.post.mockReturnValueOnce(of(postResponse));

				return { limit };
			};

			it('should ignore limit and use default headers', async () => {
				const { limit } = setup();

				// @ts-expect-error test case
				await expect(client.executeDeletions(limit)).resolves.not.toThrow();
			});
		});

		describe('when received invalid HTTP status code in a response', () => {
			const setup = () => {
				setupConfig();
				mockGetRequestIds();
				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					status: 200,
				});

				httpService.post.mockReturnValueOnce(of(response));
			};

			it('should throw an exception', async () => {
				setup();

				await expect(client.executeDeletions()).rejects.toThrow(Error);
			});
		});

		describe('when runFailed is true', () => {
			const setup = () => {
				setupConfig();
				mockGetRequestIds();

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					status: 204,
				});

				httpService.post.mockReturnValueOnce(of(response));

				const fullUrl = 'http://api-admin:4030/admin/api/v1/deletionExecutions?runFailed=true';

				return { fullUrl };
			};
			it('should call get endpoint with runFailed param', async () => {
				const { fullUrl } = setup();

				await client.executeDeletions(undefined, true);

				expect(httpService.get).toHaveBeenCalledWith(fullUrl, expect.any(Object));
			});
		});
	});
});
