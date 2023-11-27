import { ObjectId } from '@mikro-orm/mongodb';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { setupEntities } from '@shared/testing';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';

import { JwtValidationAdapter } from './jwt-validation.adapter';
import { JwtStrategy } from './jwt.strategy';

describe('jwt strategy', () => {
	let validationAdapter: DeepMocked<JwtValidationAdapter>;
	let strategy: JwtStrategy;
	let module: TestingModule;
	const jwtPayload: JwtPayload = {
		accountId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		roles: [new ObjectId().toHexString()],
		jti: 'someRandomString',
		systemId: new ObjectId().toHexString(),
		support: true,
	} as JwtPayload;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [PassportModule, JwtModule.register(jwtConstants)],
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
			validationAdapter.isWhitelisted.mockResolvedValueOnce();
			validationAdapter.isWhitelisted.mockClear();
		};

		it('should check jwt for being whitelisted', async () => {
			setup();
			await strategy.validate(jwtPayload);
			expect(validationAdapter.isWhitelisted).toHaveBeenCalledWith(jwtPayload.accountId, jwtPayload.jti);
		});

		it('should return user', async () => {
			setup();
			const user = await strategy.validate(jwtPayload);
			expect(user).toMatchObject({
				userId: jwtPayload.userId,
				roles: [jwtPayload.roles[0]],
				schoolId: jwtPayload.schoolId,
				accountId: jwtPayload.accountId,
				systemId: jwtPayload.systemId,
				impersonated: jwtPayload.support,
			});
		});
	});

	describe('when jwt is not whitelisted', () => {
		const setup = () => {
			validationAdapter.isWhitelisted.mockRejectedValueOnce(null);
			validationAdapter.isWhitelisted.mockClear();
		};

		it('should throw an UnauthorizedException', async () => {
			setup();
			await expect(() => strategy.validate(jwtPayload)).rejects.toThrow(UnauthorizedException);
		});
	});
});
