import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { axiosResponseFactory } from '@shared/testing';
import { DeletionRequestInputBuilder, DeletionRequestOutputBuilder } from '.';
import { DeletionRequestOutput } from './interface';
import { DeletionClient } from './deletion.client';

describe(DeletionClient.name, () => {
	let module: TestingModule;
	let client: DeletionClient;
	let httpService: DeepMocked<HttpService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionClient,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({
						get: jest.fn((key: string) => {
							if (key === 'ADMIN_API_CLIENT_BASE_URL') {
								return 'http://localhost:4030';
							}

							// Default is for the Admin APIs API Key.
							return '6b3df003-61e9-467c-9e6b-579634801896';
						}),
					}),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		client = module.get(DeletionClient);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('queueDeletionRequest', () => {
		describe('when sending the HTTP request failed', () => {
			const setup = () => {
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
		describe('when sending the HTTP request failed', () => {
			const setup = () => {
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
				const limit = 10;

				const response: AxiosResponse<DeletionRequestOutput> = axiosResponseFactory.build({
					status: 204,
				});

				httpService.post.mockReturnValueOnce(of(response));

				return { limit };
			};

			it('should return proper output', async () => {
				const { limit } = setup();

				await expect(client.executeDeletions(limit)).resolves.not.toThrow();
			});
		});

		describe('when received invalid HTTP status code in a response', () => {
			const setup = () => {
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
	});
});
