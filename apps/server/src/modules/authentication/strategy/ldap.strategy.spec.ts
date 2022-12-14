import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountDto } from '@src/modules/account/services/dto';
import { RoleName, School, System, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities, userFactory } from '@shared/testing';
import { AuthenticationService } from '../services/authentication.service';
import { LdapStrategy, RequestBody } from './ldap.strategy';
import { LdapService } from '../services/ldap.service';

const mockPassword = 'mockPassword123&';
const mockPasswordHash = bcrypt.hashSync(mockPassword);

describe('ldap strategy', () => {
	let orm: MikroORM;
	let strategy: LdapStrategy;
	let userRepo: DeepMocked<UserRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let ldapService: DeepMocked<LdapService>;
	let module: TestingModule;
	let mockUser: User;
	let mockAccount: AccountDto;

	beforeAll(async () => {
		orm = await setupEntities();
		mockUser = userFactory.withRole(RoleName.STUDENT).buildWithId();

		mockAccount = {
			id: 'mockAccountId',
			username: 'mockUsername',
			password: mockPasswordHash,
			userId: mockUser.id,
		} as AccountDto;

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
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	describe('when a user tries to login', () => {
		it('should throw if username parameter is missing', async () => {
			const request: { body: RequestBody } = {
				body: {
					password: 'somePassword1234$',
					schoolId: 'mockSchoolId',
					systemId: 'mockSystemId',
				},
			};
			await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw if password parameter is missing', async () => {
			const request: { body: RequestBody } = {
				body: {
					username: 'mockUserName',
					schoolId: 'mockSchoolId',
					systemId: 'mockSystemId',
				},
			};
			await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw if schoolId parameter is missing', async () => {
			const request: { body: RequestBody } = {
				body: {
					username: 'mockUserName',
					password: 'somePassword1234$',
					systemId: 'mockSystemId',
				},
			};
			await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw if systemId parameter is missing', async () => {
			const request: { body: RequestBody } = {
				body: {
					username: 'mockUserName',
					password: 'somePassword1234$',
					schoolId: 'mockSchoolId',
				},
			};
			await expect(strategy.validate(request)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw if user has no LDAP DN', async () => {
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

		it('should throw if school has no external Id', async () => {
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

		it('should throw if account has no userId', async () => {
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

		it('should throw if authentication at LDAP fails', async () => {
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
			// TODO correct mock of ldapService
			expect(authenticationService.updateLastTriedFailedLogin).toHaveBeenCalledWith(mockAccount.id);
		});
	});

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
