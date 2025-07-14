import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageClient } from '@infra/valkey-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ACCESS_TOKEN_VALKEY_CLIENT } from '../access-token.config';
import { AccessTokenService } from './access-token.service';
import { AccessTokenBuilder } from './builder';
import { AccessToken } from './vo/access-token.vo';

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
		describe('when called', () => {
			const setup = () => {
				const payload = { foo: 'bar' };
				const tokenTtl = 1234;
				const token = new AccessToken('123e4567-e89b-12d3-a456-426614174000');

				jest.spyOn(AccessTokenBuilder, 'build').mockReturnValueOnce(token);
				storageClient.set.mockResolvedValueOnce(undefined);

				return { payload, tokenTtl, token };
			};

			it('should persist token data and return the token', async () => {
				const { payload, tokenTtl, token } = setup();

				const result = await service.createToken(payload, tokenTtl);

				expect(storageClient.set).toHaveBeenCalledWith(token.token, JSON.stringify(payload), 'EX', tokenTtl);
				expect(result).toBe(token);
			});
		});
	});
});
