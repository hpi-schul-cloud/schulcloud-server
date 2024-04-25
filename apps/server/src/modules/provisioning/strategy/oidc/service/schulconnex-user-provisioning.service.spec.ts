import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountSave, AccountService } from '@modules/account';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserService } from '@modules/user';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import CryptoJS from 'crypto-js';
import { ExternalUserDto } from '../../../dto';
import { SchulconnexUserProvisioningService } from './schulconnex-user-provisioning.service';

jest.mock('crypto-js');

describe(SchulconnexUserProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexUserProvisioningService;

	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexUserProvisioningService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexUserProvisioningService);
		userService = module.get(UserService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalUser', () => {
		const setupUser = () => {
			const systemId = 'systemId';
			const schoolId = 'schoolId';
			const birthday = new Date('2023-11-17');
			const existingUser: UserDO = userDoFactory.withRoles([{ id: 'existingRoleId', name: RoleName.USER }]).buildWithId(
				{
					firstName: 'existingFirstName',
					lastName: 'existingLastName',
					email: 'existingEmail',
					schoolId: 'existingSchoolId',
					externalId: 'externalUserId',
					birthday: new Date('2023-11-16'),
				},
				'userId'
			);
			const savedUser: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).buildWithId(
				{
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId,
					externalId: 'externalUserId',
					birthday,
				},
				'userId'
			);
			const externalUser: ExternalUserDto = new ExternalUserDto({
				externalId: 'externalUserId',
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				roles: [RoleName.USER],
				birthday,
			});
			const userRole: RoleDto = new RoleDto({
				id: 'roleId',
				name: RoleName.USER,
			});
			const hash = 'hash';

			roleService.findByNames.mockResolvedValue([userRole]);
			userService.save.mockResolvedValue(savedUser);
			jest.spyOn(CryptoJS, 'SHA256').mockReturnValue({
				toString: jest.fn().mockReturnValue(hash),
				words: [],
				sigBytes: 0,
				concat: jest.fn(),
				clamp: jest.fn(),
				clone: jest.fn(),
			});

			return {
				existingUser,
				savedUser,
				externalUser,
				userRole,
				schoolId,
				systemId,
				hash,
			};
		};

		describe('when the user does not exist yet', () => {
			it('should call user service to check uniqueness of email', async () => {
				const { externalUser, schoolId, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(null);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(userService.isEmailUniqueForExternal).toHaveBeenCalledWith(externalUser.email, undefined);
			});

			it('should call the user service to save the user', async () => {
				const { externalUser, schoolId, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(null);
				userService.isEmailUniqueForExternal.mockResolvedValue(true);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(userService.save).toHaveBeenCalledWith(new UserDO({ ...savedUser, id: undefined }));
			});

			it('should return the saved user', async () => {
				const { externalUser, schoolId, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(null);

				const result: UserDO = await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(result).toEqual(savedUser);
			});

			it('should create a new account', async () => {
				const { externalUser, schoolId, systemId, hash } = setupUser();
				const account: AccountSave = {
					userId: 'userId',
					username: hash,
					systemId,
					activated: true,
				} as AccountSave;

				userService.findByExternalId.mockResolvedValue(null);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(accountService.saveWithValidation).toHaveBeenCalledWith(account);
			});

			describe('when no schoolId is provided', () => {
				it('should throw UnprocessableEntityException', async () => {
					const { externalUser } = setupUser();

					userService.findByExternalId.mockResolvedValue(null);

					const promise: Promise<UserDO> = service.provisionExternalUser(externalUser, 'systemId', undefined);

					await expect(promise).rejects.toThrow(UnprocessableEntityException);
				});
			});

			describe('when the external user has an email, that already exists', () => {
				it('should log EmailAlreadyExistsLoggable', async () => {
					const { externalUser, systemId, schoolId } = setupUser();

					userService.findByExternalId.mockResolvedValue(null);
					userService.isEmailUniqueForExternal.mockResolvedValue(false);

					await service.provisionExternalUser(externalUser, systemId, schoolId);

					expect(logger.warning).toHaveBeenCalledWith({
						email: externalUser.email,
					});
				});
			});
		});

		describe('when the user already exists', () => {
			it('should call user service to check uniqueness of email', async () => {
				const { externalUser, schoolId, systemId, existingUser } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);
				userService.isEmailUniqueForExternal.mockResolvedValue(true);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(userService.isEmailUniqueForExternal).toHaveBeenCalledWith(externalUser.email, existingUser.externalId);
			});

			it('should call the user service to save the user', async () => {
				const { externalUser, schoolId, existingUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(userService.save).toHaveBeenCalledWith(existingUser);
			});

			it('should return the updated user', async () => {
				const { externalUser, schoolId, existingUser, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);

				const result: UserDO = await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(result).toEqual(savedUser);
			});

			it('should not create a new account', async () => {
				const { externalUser, schoolId, systemId, existingUser } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(accountService.saveWithValidation).not.toHaveBeenCalled();
			});
		});
	});
});
