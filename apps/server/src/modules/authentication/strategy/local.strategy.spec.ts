import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementOauthService } from '@infra/identity-management';
import { Account } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupEntities } from '@testing/database';
import bcrypt from 'bcryptjs';
import { AuthenticationService } from '../services/authentication.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
	let strategy: LocalStrategy;
	let mockUser: User;
	let mockAccount: Account;
	let userServiceMock: DeepMocked<UserService>;
	let authenticationServiceMock: DeepMocked<AuthenticationService>;
	let idmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;
	let configServiceMock: DeepMocked<ConfigService>;

	const mockPassword = 'mockPassword123&';
	const mockPasswordHash = bcrypt.hashSync(mockPassword);

	beforeAll(async () => {
		await setupEntities([User]);
		authenticationServiceMock = createMock<AuthenticationService>();
		idmOauthServiceMock = createMock<IdentityManagementOauthService>();
		configServiceMock = createMock<ConfigService>();
		userServiceMock = createMock<UserService>();
		strategy = new LocalStrategy(authenticationServiceMock, idmOauthServiceMock, configServiceMock, userServiceMock);
		mockUser = userFactory.withRoleByName(RoleName.STUDENT).buildWithId();
		mockAccount = accountDoFactory.build({ userId: mockUser.id, password: mockPasswordHash });
	});

	beforeEach(() => {
		authenticationServiceMock.loadAccount.mockResolvedValue(mockAccount);
		authenticationServiceMock.normalizeUsername.mockImplementation((username: string) => username);
		authenticationServiceMock.normalizePassword.mockImplementation((password: string) => password);
		userServiceMock.getUserEntityWithRoles.mockResolvedValue(mockUser);
		configServiceMock.get.mockReturnValue(false);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when idm feature is active', () => {
			const setup = () => {
				const jwt = 'mock-jwt';
				configServiceMock.get.mockReturnValue(true);
				idmOauthServiceMock.resourceOwnerPasswordGrant.mockResolvedValueOnce(jwt);
				return jwt;
			};

			it('should use idm for credential validation', async () => {
				setup();
				await expect(strategy.validate('username', 'password')).resolves.not.toThrow();
				expect(idmOauthServiceMock.resourceOwnerPasswordGrant).toBeCalledTimes(1);
			});
		});

		describe('when a local user logs in', () => {
			it('should return user', async () => {
				const user = await strategy.validate('mockUsername', mockPassword);
				expect(user).toMatchObject({
					userId: mockUser.id,
					roles: [mockUser.roles[0].id],
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
				const accountNoPassword = { ...mockAccount } as Account;
				delete accountNoPassword.password;
				authenticationServiceMock.loadAccount.mockResolvedValueOnce(accountNoPassword);
				await expect(strategy.validate(mockAccount.username, mockPassword)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when an account has a wrong password', () => {
			it('should throw unauthorized error', async () => {
				await expect(strategy.validate(mockAccount.username, 'wrongPassword')).rejects.toThrow(UnauthorizedException);
				expect(authenticationServiceMock.updateLastTriedFailedLogin).toHaveBeenCalledWith(mockAccount.id);
			});
		});

		describe('when an account has no user id', () => {
			it('should throw error', async () => {
				const accountNoUser = { ...mockAccount } as Account;
				delete accountNoUser.userId;
				authenticationServiceMock.loadAccount.mockResolvedValueOnce(accountNoUser);
				await expect(strategy.validate('mockUsername', mockPassword)).rejects.toThrow(new UnauthorizedException());
			});
		});
	});
});
