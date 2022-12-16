import bcrypt from 'bcryptjs';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountDto } from '@src/modules/account/services/dto';
import { RoleName, School, System, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities, accountFactory, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LdapStrategy, RequestBody } from './ldap.strategy';
import { LdapService } from '../services/ldap.service';

describe('LdapStrategy', () => {
	let orm: MikroORM;
	let module: TestingModule;
	let strategy: LdapStrategy;
	let userRepo: DeepMocked<UserRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let ldapService: DeepMocked<LdapService>;
	let mockUser: User;
	let mockAccount: AccountDto;

	const mockPassword = 'mockPassword123&';
	const mockPasswordHash = bcrypt.hashSync(mockPassword);

	beforeAll(async () => {
		orm = await setupEntities();
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
								return Promise.resolve({ id, externalId: 'mockExternalId' } as School);
							}
							return Promise.resolve({ id } as School);
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
		authenticationService = module.get(AuthenticationService);
		schoolRepo = module.get(SchoolRepo);
		userRepo = module.get(UserRepo);
		ldapService = module.get(LdapService);

		mockUser = userFactory.withRole(RoleName.STUDENT).buildWithId();
		mockAccount = AccountEntityToDtoMapper.mapToDto(
			accountFactory.buildWithId({ userId: mockUser.id, password: mockPasswordHash })
		);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	describe('validate', () => {
		describe('when username parameter is missing', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when password parameter is missing', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when schoolId parameter is missing', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						systemId: 'mockSystemId',
					},
				};
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when systemId parameter is missing', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
					},
				};
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when user has no LDAP DN', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				userRepo.findById.mockResolvedValueOnce({ ...mockUser });
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when school has no external id', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				schoolRepo.findById.mockResolvedValueOnce({} as School);
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when account has no user id', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				const mockAccountWithoutUserId = { ...mockAccount };
				delete mockAccountWithoutUserId.userId;
				authenticationService.loadAccount.mockResolvedValueOnce(mockAccountWithoutUserId);
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when authentication with ldap fails', () => {
			it('should throw unauthorized error', async () => {
				const request: { body: RequestBody } = {
					body: {
						username: 'mockUserName',
						password: 'somePassword1234$',
						schoolId: 'mockSchoolId',
						systemId: 'mockSystemId',
					},
				};
				ldapService.checkLdapCredentials.mockRejectedValueOnce(new UnauthorizedException());
				await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
				expect(authenticationService.updateLastTriedFailedLogin).toHaveBeenCalledWith(mockAccount.id);
			});
		});

		describe('when authentication with LDAP succeeds', () => {
			it('should return user', async () => {
				const request: { body: RequestBody } = {
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
					roles: ['student'],
					schoolId: mockUser.school.id,
					accountId: mockAccount.id,
				});
			});
		});
	});
});
