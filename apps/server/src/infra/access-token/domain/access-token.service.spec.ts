import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageClient } from '@infra/valkey-client';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { ACCESS_TOKEN_VALKEY_CLIENT } from '../access-token.config';
import { AccessTokenService } from './access-token.service';

describe('AccessTokenService', () => {
	let storageClient: DeepMocked<StorageClient>;
	let service: AccessTokenService;
	let module: TestingModule;

	afterEach(() => {
		jest.resetAllMocks();
	});

	beforeAll(async () => {
		storageClient = createMock<StorageClient>();

		module = await Test.createTestingModule({
			providers: [
				AccessTokenService,
				{
					provide: ACCESS_TOKEN_VALKEY_CLIENT,
					useValue: storageClient,
				},
			],
		}).compile();

		service = module.get(AccessTokenService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createToken', () => {
		describe('when storageClient.set resolves', () => {
			const setup = () => {
				const payload = { foo: 'bar' };
				const tokenTtlInSeconds = 1234;

				storageClient.set.mockResolvedValueOnce(undefined);

				return { payload, tokenTtlInSeconds };
			};

			it('should persist token data and return the token', async () => {
				const { payload, tokenTtlInSeconds } = setup();

				const result = await service.createToken(payload, tokenTtlInSeconds);

				expect(storageClient.set).toHaveBeenCalledWith(
					expect.any(String),
					JSON.stringify(payload),
					'EX',
					tokenTtlInSeconds
				);
				expect(result.token).toEqual(expect.any(String));
				expect(result.token.length).toBe(36);
			});
		});

		describe('when storageClient.set rejects', () => {
			const setup = () => {
				const payload = { foo: 'bar' };
				const tokenTtlInSeconds = 1234;
				const error = new Error('Storage error');

				storageClient.set.mockRejectedValueOnce(error);

				return { payload, tokenTtlInSeconds, error };
			};

			it('should throw an error', async () => {
				const { payload, tokenTtlInSeconds, error } = setup();

				await expect(service.createToken(payload, tokenTtlInSeconds)).rejects.toThrow(error);
				expect(storageClient.set).toHaveBeenCalledWith(
					expect.any(String),
					JSON.stringify(payload),
					'EX',
					tokenTtlInSeconds
				);
			});
		});
	});

	describe('resolveToken', () => {
		describe('given storageClient.get resolves', () => {
			describe('when token exists and is valid JSON', () => {
				const setup = () => {
					const token = randomUUID();
					const tokenTtlInSeconds = 1234;
					const payload = { foo: 'bar' };
					const value = JSON.stringify(payload);

					storageClient.get.mockResolvedValueOnce(value);
					const buildMock = jest.fn<object, [object]>().mockImplementation((data: object): object => {
						return { ...data };
					});

					return { token, tokenTtlInSeconds, payload, value, buildMock };
				};

				it('should return the parsed payload and renew the token timeout', async () => {
					const { token, tokenTtlInSeconds, payload, buildMock } = setup();

					const result = await service.resolveToken({ token, tokenTtlInSeconds }, buildMock);

					expect(storageClient.get).toHaveBeenCalledWith(token);
					expect(result).toEqual(payload);
				});

				it('should renew the token timeout', async () => {
					const { token, tokenTtlInSeconds, payload, buildMock } = setup();

					await service.resolveToken({ token, tokenTtlInSeconds }, buildMock);

					expect(storageClient.set).toHaveBeenCalledWith(
						expect.any(String),
						JSON.stringify(payload),
						'EX',
						tokenTtlInSeconds
					);
				});

				it('should call build with the parsed payload', async () => {
					const { token, tokenTtlInSeconds, payload, buildMock } = setup();

					await service.resolveToken({ token, tokenTtlInSeconds }, buildMock);

					expect(buildMock).toHaveBeenCalledWith(payload);
				});
			});

			describe('when token does not exist', () => {
				const setup = () => {
					const token = 'token-uuid';
					const tokenTtlInSeconds = 1234;
					const error = new ForbiddenException(`Token ${token} not found`);
					const buildMock = jest.fn<object, [object]>().mockImplementation((data: object): object => {
						return { ...data };
					});

					storageClient.get.mockResolvedValueOnce(null);

					return { token, tokenTtlInSeconds, error, buildMock };
				};

				it('should throw ForbiddenException', async () => {
					const { token, tokenTtlInSeconds, error, buildMock } = setup();

					await expect(service.resolveToken({ token, tokenTtlInSeconds }, buildMock)).rejects.toThrow(error);
					expect(storageClient.get).toHaveBeenCalledWith(token);
				});
			});

			describe('when token value is invalid JSON', () => {
				const setup = () => {
					const token = 'token-uuid';
					const tokenTtlInSeconds = 1234;
					const value = 'not-json';
					const jsonError = new Error(`Unexpected token 'o', \"not-json\" is not valid JSON`);
					const error = new InternalServerErrorException(`Failed to parse token payload for token ${token}`, {
						cause: jsonError,
					});
					const buildMock = jest.fn<object, [object]>().mockImplementation((data: object): object => {
						return { ...data };
					});

					storageClient.get.mockResolvedValueOnce(value);

					return { token, tokenTtlInSeconds, value, error, buildMock };
				};

				it('should throw InternalServerErrorException', async () => {
					const { token, tokenTtlInSeconds, error, buildMock } = setup();

					await expect(service.resolveToken({ token, tokenTtlInSeconds }, buildMock)).rejects.toThrowError(error);
					expect(storageClient.get).toHaveBeenCalledWith(token);
				});
			});
		});

		describe('given storageClient.get rejects', () => {
			const setup = () => {
				const token = randomUUID();
				const tokenTtlInSeconds = 1234;
				const error = new Error('Storage error');
				storageClient.get.mockRejectedValueOnce(error);
				const buildMock = jest.fn<object, [object]>().mockImplementation((data: object): object => {
					return { ...data };
				});

				return { token, tokenTtlInSeconds, error, buildMock };
			};

			it('should throw an error', async () => {
				const { token, tokenTtlInSeconds, error, buildMock } = setup();

				await expect(service.resolveToken({ token, tokenTtlInSeconds }, buildMock)).rejects.toThrow(error);
				expect(storageClient.get).toHaveBeenCalledWith(token);
			});
		});
	});
});
