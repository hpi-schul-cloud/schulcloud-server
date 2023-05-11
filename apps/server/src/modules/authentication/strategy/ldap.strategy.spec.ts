import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, System, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import {
	accountDtoFactory,
	schoolDOFactory,
	schoolFactory,
	setupEntities,
	systemFactory,
	userFactory,
} from '@shared/testing';
import { AccountDto } from '@src/modules/account/services/dto';
import bcrypt from 'bcryptjs';
import { LdapAuthorizationBodyParams } from '../controllers/dto';
import { ICurrentUser } from '../interface';
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
	let systemRepo: DeepMocked<SystemRepo>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [PassportModule],
			providers: [
				LdapStrategy,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: LdapService,
					useValue: createMock<LdapService>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();

		strategy = module.get(LdapStrategy);
		authenticationServiceMock = module.get(AuthenticationService);
		schoolRepoMock = module.get(SchoolRepo);
		userRepoMock = module.get(UserRepo);
		ldapServiceMock = module.get(LdapService);
		systemRepo = module.get(SystemRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when user has no LDAP DN', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: undefined });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [system.id] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);

				return {
					request,
				};
			};

			it('should throw unauthorized error', async () => {
				const { request } = setup();

				const func = async () => strategy.validate(request);

				await expect(func).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when school does not have the system', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: 'mockLdapDn' });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);

				return {
					request,
				};
			};

			it('should throw unauthorized error', async () => {
				const { request } = setup();

				const func = async () => strategy.validate(request);

				await expect(func).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when school has no systems', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: 'mockLdapDn' });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: undefined }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);

				return {
					request,
				};
			};

			it('should throw unauthorized error', async () => {
				const { request } = setup();

				const func = async () => strategy.validate(request);

				await expect(func).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when account has no user id', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: 'mockLdapDn' });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [system.id] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: undefined,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);

				return {
					request,
				};
			};

			it('should throw unauthorized error', async () => {
				const { request } = setup();

				const func = async () => strategy.validate(request);

				await expect(func).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when authentication with ldap fails', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: 'mockLdapDn' });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [system.id] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);
				ldapServiceMock.checkLdapCredentials.mockRejectedValueOnce(new UnauthorizedException());

				return {
					request,
					account,
				};
			};

			it('should throw unauthorized error', async () => {
				const { request, account } = setup();

				const func = async () => strategy.validate(request);

				await expect(func).rejects.toThrow(UnauthorizedException);

				expect(authenticationServiceMock.updateLastTriedFailedLogin).toHaveBeenCalledWith(account.id);
			});
		});

		describe('when connection to ldap fails', () => {
			const setup = () => {
				const error = new Error('error');
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory.withRoleByName(RoleName.STUDENT).buildWithId({ ldapDn: 'mockLdapDn' });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [system.id] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);
				ldapServiceMock.checkLdapCredentials.mockRejectedValueOnce(error);

				return {
					request,
					error,
				};
			};

			it('should throw error', async () => {
				const { error, request } = setup();

				await expect(strategy.validate(request)).rejects.toThrow(error);
			});

			it('should not update last tried login failed', async () => {
				const { error, request } = setup();

				await expect(strategy.validate(request)).rejects.toThrow(error);

				expect(authenticationServiceMock.updateLastTriedFailedLogin).not.toHaveBeenCalled();
			});
		});

		describe('when authentication with LDAP succeeds', () => {
			const setup = () => {
				const username = 'mockUserName';
				const password = 'somePassword1234$';

				const system: System = systemFactory.withLdapConfig({ rootPath: 'rootPath' }).buildWithId();

				const user: User = userFactory
					.withRoleByName(RoleName.STUDENT)
					.buildWithId({ ldapDn: 'mockLdapDn', school: schoolFactory.buildWithId() });

				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [system.id] }, user.school.id);

				const account: AccountDto = accountDtoFactory.build({
					systemId: system.id,
					username,
					password: bcrypt.hashSync(password),
					userId: user.id,
				});

				const request: { body: LdapAuthorizationBodyParams } = {
					body: {
						username,
						password,
						schoolId: school.id as string,
						systemId: system.id,
					},
				};

				systemRepo.findById.mockResolvedValue(system);
				authenticationServiceMock.loadAccount.mockResolvedValue(account);
				authenticationServiceMock.normalizeUsername.mockReturnValue(username);
				authenticationServiceMock.normalizePassword.mockReturnValue(password);
				userRepoMock.findById.mockResolvedValue(user);
				schoolRepoMock.findById.mockResolvedValue(school);

				return {
					request,
					user,
					school,
					account,
					system,
				};
			};

			it('should return user', async () => {
				const { request, user, school, account, system } = setup();

				const result: ICurrentUser = await strategy.validate(request);

				expect(result).toEqual({
					userId: user.id,
					roles: [user.roles[0].id],
					schoolId: school.id,
					systemId: system.id,
					accountId: account.id,
				});
			});
		});
	});
});
