import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { jwtPayloadFactory, setupEntities } from '@shared/testing';

import { JwtValidationAdapter } from '../adapter/jwt-validation.adapter';
import { JwtStrategy } from './jwt.strategy';

jest.mock('../config', () => {
	const authConfig = {
		secret: 'mysecret',
		jwtOptions: {
			header: { typ: 'JWT' },
			audience: 'myaudience',
			issuer: 'myissuer',
			algorithm: 'HS256',
			expiresIn: '1h',
		},
	};

	return {
		authConfig,
	};
});

const buildAuthConfig = () => {
	return {
		secret: 'mysecret',
		jwtOptions: {
			header: { typ: 'JWT' },
			audience: 'myaudience',
			issuer: 'myissuer',
			algorithm: 'HS256',
			expiresIn: '1h',
		},
	};
};

describe('jwt strategy', () => {
	let validationAdapter: DeepMocked<JwtValidationAdapter>;
	let strategy: JwtStrategy;
	let module: TestingModule;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [PassportModule, JwtModule.register(buildAuthConfig())],
			providers: [
				JwtStrategy,
				{
					provide: JwtValidationAdapter,
					useValue: createMock<JwtValidationAdapter>(),
				},
			],
		}).compile();

		strategy = module.get(JwtStrategy);
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
			await expect(() => strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
		});
	});
});
