import { ObjectId } from '@mikro-orm/mongodb';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';

import { JwtValidationAdapter } from './jwt-validation.adapter';
import { JwtStrategy } from './jwt.strategy';

describe('jwt strategy', () => {
	let adapter: DeepMocked<JwtValidationAdapter>;
	let strategy: JwtStrategy;
	let repo: DeepMocked<UserRepo>;
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
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		strategy = module.get(JwtStrategy);
		repo = module.get(UserRepo);
		adapter = module.get(JwtValidationAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
		expect(adapter).toBeDefined();
		expect(repo).toBeDefined();
	});

	describe('when authenticate a user with jwt', () => {
		it('should check jwt for being whitelisted', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			await strategy.validate({ accountId, jti } as JwtPayload);
			expect(adapter.isWhitelisted).toHaveBeenCalledWith(accountId, jti);
		});
		it('should load the defined user', async () => {
			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			const payload = { accountId, jti, userId } as JwtPayload;
			repo.findById.mockResolvedValue(userFactory.build());
			await strategy.validate(payload);
			expect(repo.findById).toHaveBeenCalledWith(userId);
		});

		it('should throw an UnauthorizedException when the user is not found', async () => {
			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			repo.findById.mockRejectedValue(new NotFoundException());
			const payload = { accountId, jti, userId } as JwtPayload;
			await expect(() => strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
		});
	});
});
