import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName, User } from '@shared/domain';
import { IdentityManagementOauthService } from '@shared/infra/identity-management';
import { UserRepo } from '@shared/repo';
import { accountFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AccountDto } from '@src/modules/account/services/dto';
import { IServerConfig } from '@src/modules/server';
import bcrypt from 'bcryptjs';
import { AuthenticationService } from '../services/authentication.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
	let strategy: LocalStrategy;
	let mockUser: User;
	let mockAccount: AccountDto;
	let userRepoMock: DeepMocked<UserRepo>;
	let authenticationServiceMock: DeepMocked<AuthenticationService>;
	let idmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;
	let configServiceMock: DeepMocked<ConfigService>;

	const mockPassword = 'mockPassword123&';
	const mockPasswordHash = bcrypt.hashSync(mockPassword);

	beforeAll(async () => {
		await setupEntities();
		authenticationServiceMock = createMock<AuthenticationService>();
		idmOauthServiceMock = createMock<IdentityManagementOauthService>();
		configServiceMock = createMock<ConfigService<IServerConfig, true>>();
		userRepoMock = createMock<UserRepo>();
		strategy = new LocalStrategy(authenticationServiceMock, idmOauthServiceMock, configServiceMock, userRepoMock);
		mockUser = userFactory.withRole(RoleName.STUDENT).buildWithId();
		mockAccount = AccountEntityToDtoMapper.mapToDto(
			accountFactory.buildWithId({ userId: mockUser.id, password: mockPasswordHash })
		);
	});

	beforeEach(() => {
		authenticationServiceMock.loadAccount.mockResolvedValue(mockAccount);
		authenticationServiceMock.normalizeUsername.mockImplementation((username: string) => username);
		authenticationServiceMock.normalizePassword.mockImplementation((password: string) => password);
		userRepoMock.findById.mockResolvedValue(mockUser);
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
				const accountNoPassword = { ...mockAccount };
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
				const accountNoUser = { ...mockAccount };
				delete accountNoUser.userId;
				authenticationServiceMock.loadAccount.mockResolvedValueOnce(accountNoUser);
				await expect(strategy.validate('mockUsername', mockPassword)).rejects.toThrow(
					new Error(`login failing, because account ${mockAccount.id} has no userId`)
				);
			});
		});
	});
});
