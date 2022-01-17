import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';

import { JwtStrategy } from './jwt.strategy';
import { JwtValidationAdapter } from './jwt-validation.adapter';

describe('jwt strategy', () => {
	let adapter: JwtValidationAdapter;
	let strategy: JwtStrategy;
	let repo: UserRepo;
	let module: TestingModule;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			imports: [PassportModule, JwtModule.register(jwtConstants)],
			providers: [
				JwtStrategy,
				{
					provide: JwtValidationAdapter,
					useValue: {
						isWhitelisted() {
							return Promise.resolve();
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById() {
							return userFactory.build();
						},
					},
				},
			],
		}).compile();

		strategy = module.get(JwtStrategy);
		repo = module.get(UserRepo);
		adapter = module.get(JwtValidationAdapter);
	});

	afterAll(async () => {
		await orm.close();
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
			const isWhitelistedSpy = jest.spyOn(adapter, 'isWhitelisted');
			await strategy.validate({ accountId, jti } as JwtPayload);
			expect(isWhitelistedSpy).toHaveBeenCalledWith(accountId, jti);
		});
		it('should load the defined user', async () => {
			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			const resolveUserSpy = jest.spyOn(repo, 'findById');
			const payload = { accountId, jti, userId } as JwtPayload;
			await strategy.validate(payload);
			expect(resolveUserSpy).toHaveBeenCalledWith(userId);
		});

		it('should throw an UnauthorizedException when the user is not found', async () => {
			const accountId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			const resolveUserSpy = jest.spyOn(repo, 'findById').mockRejectedValue(new NotFoundException());
			const payload = { accountId, jti, userId } as JwtPayload;
			await expect(() => strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
			resolveUserSpy.mockRestore();
		});
	});
});
