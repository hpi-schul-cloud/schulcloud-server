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
				const tokenTtl = 1234;

				storageClient.set.mockResolvedValueOnce(undefined);

				return { payload, tokenTtl };
			};

			it('should persist token data and return the token', async () => {
				const { payload, tokenTtl } = setup();

				const result = await service.createToken(payload, tokenTtl);

				expect(storageClient.set).toHaveBeenCalledWith(expect.any(String), JSON.stringify(payload), 'EX', tokenTtl);
				expect(result.token).toEqual(expect.any(String));
				expect(result.token.length).toBe(36);
			});
		});

		describe('when storageClient.set rejects', () => {
			const setup = () => {
				const payload = { foo: 'bar' };
				const tokenTtl = 1234;
				const error = new Error('Storage error');

				storageClient.set.mockRejectedValueOnce(error);

				return { payload, tokenTtl, error };
			};

			it('should throw an error', async () => {
				const { payload, tokenTtl, error } = setup();

				await expect(service.createToken(payload, tokenTtl)).rejects.toThrow(error);
				expect(storageClient.set).toHaveBeenCalledWith(expect.any(String), JSON.stringify(payload), 'EX', tokenTtl);
			});
		});
	});

	describe('resolveToken', () => {
		describe('given storageClient.get resolves', () => {
			describe('when token exists and is valid JSON', () => {
				const setup = () => {
					const token = randomUUID();
					const tokenTtl = 1234;
					const payload = { foo: 'bar' };
					const value = JSON.stringify(payload);

					storageClient.get.mockResolvedValueOnce(value);

					return { token, tokenTtl, payload, value };
				};

				it('should return the parsed payload and renew the token timeout', async () => {
					const { token, tokenTtl, payload } = setup();

					const result = await service.resolveToken({ token, tokenTtl });

					expect(storageClient.get).toHaveBeenCalledWith(token);
					expect(storageClient.set).toHaveBeenCalledWith(expect.any(String), JSON.stringify(payload), 'EX', tokenTtl);
					expect(result).toEqual(payload);
				});
			});

			describe('when token does not exist', () => {
				const setup = () => {
					const token = 'token-uuid';
					const tokenTtl = 1234;
					const error = new ForbiddenException(`Token ${token} not found`);

					storageClient.get.mockResolvedValueOnce(null);

					return { token, tokenTtl, error };
				};

				it('should throw ForbiddenException', async () => {
					const { token, tokenTtl, error } = setup();

					await expect(service.resolveToken({ token, tokenTtl })).rejects.toThrow(error);
					expect(storageClient.get).toHaveBeenCalledWith(token);
				});
			});

			describe('when token value is invalid JSON', () => {
				const setup = () => {
					const token = 'token-uuid';
					const tokenTtl = 1234;
					const value = 'not-json';
					const jsonError = new Error(`Unexpected token 'o', \"not-json\" is not valid JSON`);
					const error = new InternalServerErrorException(`Invalid payload for token ${token}`, { cause: jsonError });

					storageClient.get.mockResolvedValueOnce(value);

					return { token, tokenTtl, value, error };
				};

				it('should throw InternalServerErrorException', async () => {
					const { token, tokenTtl, error } = setup();

					await expect(service.resolveToken({ token, tokenTtl })).rejects.toThrowError(error);
					expect(storageClient.get).toHaveBeenCalledWith(token);
				});
			});
		});

		describe('given storageClient.get rejects', () => {
			const setup = () => {
				const token = randomUUID();
				const tokenTtl = 1234;
				const error = new Error('Storage error');
				storageClient.get.mockRejectedValueOnce(error);

				return { token, tokenTtl, error };
			};

			it('should throw an error', async () => {
				const { token, tokenTtl, error } = setup();

				await expect(service.resolveToken({ token, tokenTtl })).rejects.toThrow(error);
				expect(storageClient.get).toHaveBeenCalledWith(token);
			});
		});
	});
});
