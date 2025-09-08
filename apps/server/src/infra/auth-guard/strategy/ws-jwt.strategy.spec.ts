import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { JwtValidationAdapter } from '../adapter';
import { WsJwtStrategy } from './ws-jwt.strategy';
import { jwtPayloadFactory } from '../testing';

describe('jwt strategy', () => {
	let validationAdapter: DeepMocked<JwtValidationAdapter>;
	let strategy: WsJwtStrategy;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				WsJwtStrategy,
				{
					provide: JwtValidationAdapter,
					useValue: createMock<JwtValidationAdapter>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		strategy = module.get(WsJwtStrategy);
		validationAdapter = module.get(JwtValidationAdapter);
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

			await expect(() => strategy.validate(mockJwtPayload)).rejects.toThrow(WsException);
		});
	});
});
