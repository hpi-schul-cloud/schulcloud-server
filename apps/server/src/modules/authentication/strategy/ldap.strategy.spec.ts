import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, System, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { accountFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AccountDto } from '@src/modules/account/services/dto';
import bcrypt from 'bcryptjs';
import { LdapAuthorizationParams } from '../controllers/dto';
import { AuthenticationService } from '../services/authentication.service';
import { LdapService } from '../services/ldap.service';
import { LdapStrategy } from './ldap.strategy';

describe('LdapStrategy', () => {
	let module: TestingModule;
	let strategy: LdapStrategy;
	let userRepoMock: DeepMocked<UserRepo>;
	let schoolRepoMock: DeepMocked<SchoolRepo>;
	let authenticationServiceMock: DeepMocked<AuthenticationService>;
	let ldapServiceMock: DeepMocked<LdapService>;
	let mockUser: User;
	let mockAccount: AccountDto;

	const mockPassword = 'mockPassword123&';
	const mockPasswordHash = bcrypt.hashSync(mockPassword);

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [PassportModule],
			providers: [
				LdapStrategy,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>({
						loadAccount: (username) => Promise.resolve({ ...mockAccount, username }),
						normalizeUsername: (username: string) => username,
						normalizePassword: (password: string) => password,
					}),
				},
				{
					provide: LdapService,
					useValue: createMock<LdapService>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>({
						findById: (id: string) => Promise.resolve({ ...mockUser, id, ldapDn: 'mockLdapDn' } as User),
					}),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>({
						findById: (id: string) => {
							if (id !== 'missingExternalId') {
								return Promise.resolve({ id, externalId: 'mockExternalId' } as SchoolDO);
							}
							return Promise.resolve({ id } as SchoolDO);
						},
					}),
				},
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>({
						findById: (id) => Promise.resolve({ id } as System),
					}),
				},
			],
		}).compile();

		strategy = module.get(LdapStrategy);
		authenticationServiceMock = module.get(AuthenticationService);
		schoolRepoMock = module.get(SchoolRepo);
		userRepoMock = module.get(UserRepo);
		ldapServiceMock = module.get(LdapService);

		mockUser = userFactory.withRoleByName(RoleName.STUDENT).buildWithId();
		mockAccount = AccountEntityToDtoMapper.mapToDto(
			accountFactory.buildWithId({ userId: mockUser.id, password: mockPasswordHash })
		);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when user has no LDAP DN', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				userRepoMock.findById.mockResolvedValueOnce({ ...mockUser });

				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when school has no external id', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				schoolRepoMock.findById.mockResolvedValueOnce({} as SchoolDO);

				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when account has no user id', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				const mockAccountWithoutUserId = { ...mockAccount };
				delete mockAccountWithoutUserId.userId;
				authenticationServiceMock.loadAccount.mockResolvedValueOnce(mockAccountWithoutUserId);

				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when authentication with ldap fails', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};

				ldapServiceMock.checkLdapCredentials.mockRejectedValueOnce(new UnauthorizedException());

				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);

				expect(authenticationServiceMock.updateLastTriedFailedLogin).toHaveBeenCalledWith(mockAccount.id);
			});
		});

		describe('when connection to ldap fails', () => {
			const setup = () => {
				const error = new Error('error');
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};

				ldapServiceMock.checkLdapCredentials.mockRejectedValueOnce(error);

				return { error, request };
			};

			it('should throw error', async () => {
				const { error, request } = setup();

				await expect(strategy.validate(request)).rejects.toThrow(error);
			});

			it('should not update last tried login failed', async () => {
				const { error, request } = setup();

				await expect(strategy.validate(request)).rejects.toThrow(error);

				expect(authenticationServiceMock.updateLastTriedFailedLogin).not.toHaveBeenCalledWith(mockAccount.id);
			});
		});

		describe('when authentication with LDAP succeeds', () => {
			it('should return user', async () => {
				const request: { body: LdapAuthorizationParams } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};

				const user = await strategy.validate(request);

				expect(user).toMatchObject({
					userId: mockUser.id,
					roles: [mockUser.roles[0].id],
					schoolId: mockUser.school.id,
					accountId: mockAccount.id,
				});
			});
		});
	});
});
