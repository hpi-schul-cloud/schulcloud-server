import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { RoleRepo, UserRepo } from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Role, User } from '@shared/domain';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';

import { JwtStrategy } from './jwt.strategy';
import { JwtValidationAdapter } from './jwt-validation.adapter';

describe('jwt strategy', () => {
	let strategy: JwtStrategy;
	let module: TestingModule;
	let orm: MikroORM;

	let adapter: DeepMocked<JwtValidationAdapter>;
	let userRepo: DeepMocked<UserRepo>;
	let roleRepo: DeepMocked<RoleRepo>;

	beforeEach(async () => {
		orm = await setupEntities();

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
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
			],
		}).compile();

		strategy = module.get(JwtStrategy);
		adapter = module.get(JwtValidationAdapter);
		userRepo = module.get(UserRepo);
		roleRepo = module.get(RoleRepo);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
		expect(adapter).toBeDefined();
		expect(userRepo).toBeDefined();
		expect(roleRepo).toBeDefined();
	});

	describe('when authenticate a user with jwt', () => {
		let role: Role;
		let user: User;
		let payload: JwtPayload;

		beforeEach(() => {
			role = roleFactory.buildWithId();
			user = userFactory.buildWithId();
			payload = {
				accountId: new ObjectId().toHexString(),
				jti: new ObjectId().toHexString(),
				userId: new ObjectId().toHexString(),
				roles: [role.id],
			} as JwtPayload;

			userRepo.findById.mockResolvedValue(user);
			roleRepo.findByIds.mockResolvedValue([role]);
		});

		it('should check jwt for being whitelisted', async () => {
			await strategy.validate(payload);

			expect(adapter.isWhitelisted).toHaveBeenCalledWith(payload.accountId, payload.jti);
		});

		it('should load the defined user', async () => {
			const result: JwtPayload = await strategy.validate(payload);

			expect(userRepo.findById).toHaveBeenCalledWith(payload.userId);
			expect(result).toEqual(
				expect.objectContaining({
					...payload,
					user: {
						firstName: user.firstName,
						lastName: user.lastName,
						id: user.id,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
						roles: [{ id: role.id, name: role.name }],
						permissions: [],
						schoolId: user.school.id,
					},
				})
			);
		});

		it('should throw an UnauthorizedException when the user is not found', async () => {
			userRepo.findById.mockRejectedValue(new NotFoundException());

			await expect(() => strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw an UnauthorizedException when the user is not found', async () => {
			payload.roles = [];

			await expect(() => strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
		});
	});
});
