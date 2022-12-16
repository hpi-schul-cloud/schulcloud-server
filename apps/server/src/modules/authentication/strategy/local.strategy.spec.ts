import bcrypt from 'bcryptjs';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { RoleName, User } from '@shared/domain';
import { setupEntities, accountFactory, userFactory } from '@shared/testing';
import { AccountDto } from '@src/modules/account/services/dto';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { MikroORM } from '@mikro-orm/core';
import { LocalStrategy } from './local.strategy';
import { AuthenticationService } from '../services/authentication.service';

describe('LocalStrategy', () => {
	let orm: MikroORM;
	let strategy: LocalStrategy;
	let userRepo: DeepMocked<UserRepo>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let module: TestingModule;
	let mockUser: User;
	let mockAccount: AccountDto;

	const mockPassword = 'mockPassword123&';
	const mockPasswordHash = bcrypt.hashSync(mockPassword);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [PassportModule],
			providers: [
				LocalStrategy,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>({
						normalizeUsername: (username: string) => username,
						normalizePassword: (password: string) => password,
					}),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		orm = await setupEntities();
		strategy = module.get(LocalStrategy);
		authenticationService = module.get(AuthenticationService);
		userRepo = module.get(UserRepo);
		mockUser = userFactory.withRole(RoleName.STUDENT).buildWithId();
		mockAccount = AccountEntityToDtoMapper.mapToDto(
			accountFactory.build({ userId: mockUser.id, password: mockPasswordHash })
		);

		authenticationService.loadAccount.mockResolvedValue(mockAccount);
		userRepo.findById.mockResolvedValue(mockUser);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	describe('validate', () => {
		beforeEach(() => {
			authenticationService.updateLastTriedFailedLogin.mockClear();
		});

		describe('when a local user logs in', () => {
			it('should return user', async () => {
				const user = await strategy.validate('mockUsername', mockPassword);
				expect(user).toMatchObject({
					userId: mockUser.id,
					roles: ['student'],
					schoolId: mockUser.school.id,
					accountId: mockAccount.id,
				});
			});
		});

		describe('when no user is provided', () => {
			it('should throw unauthorized error', async () => {
				await expect(strategy.validate()).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when an account has no password', () => {
			it('should throw unauthorized error', async () => {
				const accountNoPassword = { ...mockAccount };
				delete accountNoPassword.password;
				authenticationService.loadAccount.mockResolvedValueOnce(accountNoPassword);
				await expect(strategy.validate(mockAccount.username, mockPassword)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when an account has a wrong password', () => {
			it('should throw unauthorized error', async () => {
				await expect(strategy.validate(mockAccount.username, 'wrongPassword')).rejects.toThrow(UnauthorizedException);
				expect(authenticationService.updateLastTriedFailedLogin).toHaveBeenCalledWith(mockAccount.id);
			});
		});

		describe('when an account has no user id', () => {
			it('should throw error', async () => {
				const accountNoUser = { ...mockAccount };
				delete accountNoUser.userId;
				authenticationService.loadAccount.mockResolvedValueOnce(accountNoUser);
				await expect(strategy.validate('mockUsername', mockPassword)).rejects.toThrow(
					new Error(`login failing, because account ${mockAccount.id} has no userId`)
				);
			});
		});
	});
});
