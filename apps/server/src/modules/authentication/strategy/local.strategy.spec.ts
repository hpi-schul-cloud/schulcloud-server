import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRepo } from '@shared/repo';
import { AccountDto } from '@src/modules/account/services/dto';
import { Role, RoleName, School, User } from '@shared/domain';
import { Collection } from '@mikro-orm/core';
import { LocalStrategy } from './local.strategy';
import { AuthenticationService } from '../services/authentication.service';

const mockPassword = 'mockPassword123&';
const mockPasswordHash = bcrypt.hashSync(mockPassword);

const studentRole: Role = { id: 'mockRoleId', name: RoleName.STUDENT } as Role;
const mockUser: User = {
	id: 'mockUserId',
	roles: new Collection<Role>(null, [studentRole]),
	school: { id: 'mockSchoolId' } as School,
} as User;
const mockAccount = {
	id: 'mockAccountId',
	username: 'mockUsername',
	password: mockPasswordHash,
	userId: mockUser.id,
} as AccountDto;

describe('local strategy', () => {
	let strategy: LocalStrategy;
	let userRepo: DeepMocked<UserRepo>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [PassportModule],
			providers: [
				LocalStrategy,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		strategy = module.get(LocalStrategy);
		authenticationService = module.get(AuthenticationService);
		userRepo = module.get(UserRepo);

		authenticationService.loadAccount.mockResolvedValue(mockAccount);
		userRepo.findById.mockResolvedValue(mockUser);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should return user', async () => {
		const user = await strategy.validate('mockUsername', mockPassword);
		expect(user).toMatchObject({
			userId: mockUser.id,
			roles: ['student'],
			schoolId: mockUser.school.id,
			accountId: mockAccount.id,
		});
	});

	describe('should fail to authenticate', () => {
		it('when no username is provided', async () => {
			await expect(strategy.validate()).rejects.toThrow(UnauthorizedException);
		});
		it('when no password is provided', async () => {
			await expect(strategy.validate(mockAccount.username)).rejects.toThrow(UnauthorizedException);
		});
		it('when account does not have password', async () => {
			const accountNoPassword = { ...mockAccount };
			delete accountNoPassword.password;
			authenticationService.loadAccount.mockResolvedValueOnce(accountNoPassword);
			await expect(strategy.validate(mockAccount.username, mockPassword)).rejects.toThrow(UnauthorizedException);
		});
		it('when account does have a wrong password', async () => {
			await expect(strategy.validate(mockAccount.username, 'wrongPassword')).rejects.toThrow(UnauthorizedException);
		});
		it('when account does not have a user id', async () => {
			const accountNoUser = { ...mockAccount };
			delete accountNoUser.userId;
			authenticationService.loadAccount.mockResolvedValueOnce(accountNoUser);
			await expect(strategy.validate('mockUsername', mockPassword)).rejects.toThrow(
				new Error(`login failing, because account ${mockAccount.id} has no userId`)
			);
		});
	});
});
