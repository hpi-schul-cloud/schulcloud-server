import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JWT_AUTH_GUARD_CONFIG_TOKEN, type JwtAuthGuardConfig } from '../config';
import { jwtPayloadFactory } from '../testing';
import { JwtStrategy } from './jwt.strategy';

describe('jwt strategy', () => {
	let validationAdapter: DeepMocked<JwtWhitelistAdapter>;
	let strategy: JwtStrategy;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: JwtWhitelistAdapter,
					useValue: createMock<JwtWhitelistAdapter>(),
				},
				{
					provide: JWT_AUTH_GUARD_CONFIG_TOKEN,
					useValue: {
						jwtPublicKey: 'testKey',
						jwtSigningAlgorithm: 'RS256',
						scDomain: 'test.domain',
					},
				},
			],
		}).compile();

		const config = module.get<JwtAuthGuardConfig>(JWT_AUTH_GUARD_CONFIG_TOKEN);
		validationAdapter = module.get(JwtWhitelistAdapter);
		strategy = new JwtStrategy(validationAdapter, config);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
		expect(validationAdapter).toBeDefined();
	});

	describe('when authenticate a user with jwt', () => {
		const setup = () => {
			const mockJwtPayload = jwtPayloadFactory.build();

			validationAdapter.isWhitelisted.mockResolvedValueOnce();
			validationAdapter.isWhitelisted.mockClear();
			return {
				mockJwtPayload,
			};
		};

		it('should check jwt for being whitelisted', async () => {
			const { mockJwtPayload } = setup();
			await strategy.validate(mockJwtPayload);
			expect(validationAdapter.isWhitelisted).toHaveBeenCalledWith(mockJwtPayload.accountId, mockJwtPayload.jti);
		});

		it('should return user', async () => {
			const { mockJwtPayload } = setup();
			const user = await strategy.validate(mockJwtPayload);
			expect(user).toMatchObject({
				userId: mockJwtPayload.userId,
				roles: [mockJwtPayload.roles[0]],
				schoolId: mockJwtPayload.schoolId,
				accountId: mockJwtPayload.accountId,
				systemId: mockJwtPayload.systemId,
				support: mockJwtPayload.support,
			});
		});
	});

	describe('when jwt is not whitelisted', () => {
		const setup = () => {
			const mockJwtPayload = jwtPayloadFactory.build();
			validationAdapter.isWhitelisted.mockRejectedValueOnce(null);
			validationAdapter.isWhitelisted.mockClear();
			return {
				mockJwtPayload,
			};
		};

		it('should throw an UnauthorizedException', async () => {
			const { mockJwtPayload } = setup();
			await expect(() => strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('when authenticate a service account with jwt', () => {
		const setup = () => {
			const mockJwtPayload = jwtPayloadFactory.asServiceAccount().build();

			validationAdapter.isWhitelisted.mockResolvedValueOnce();
			validationAdapter.isWhitelisted.mockClear();

			return {
				mockJwtPayload,
			};
		};

		it('should return user with isServiceAccount flag preserved', async () => {
			const { mockJwtPayload } = setup();

			const user = await strategy.validate(mockJwtPayload);

			expect(user.isServiceAccount).toBe(true);
		});
	});
});
