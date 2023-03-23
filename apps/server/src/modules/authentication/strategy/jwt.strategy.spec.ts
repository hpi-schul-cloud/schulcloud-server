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
		it('should check jwt for being whitelisted', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			await strategy.validate({ accountId, jti } as JwtPayload);
			expect(validationAdapter.isWhitelisted).toHaveBeenCalledWith(accountId, jti);
		});

		it('should throw an UnauthorizedException when the user is not found', async () => {
			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			validationAdapter.isWhitelisted.mockRejectedValueOnce(null);
			const payload = { accountId, jti, userId } as JwtPayload;
			await expect(() => strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
		});
	});
});
