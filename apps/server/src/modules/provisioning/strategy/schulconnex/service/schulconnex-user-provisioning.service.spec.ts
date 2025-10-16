import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountSave, AccountService } from '@modules/account';
import { RoleName, RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';
import { ExternalUserDto } from '../../../dto';
import { SchoolMissingLoggableException, UserRoleUnknownLoggableException } from '../../../loggable';
import { externalUserDtoFactory } from '../../../testing';
import { SchulconnexUserProvisioningService } from './schulconnex-user-provisioning.service';

describe(SchulconnexUserProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexUserProvisioningService;

	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;

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
			const existingUser = userDoFactory.withRoles([{ id: 'existingRoleId', name: RoleName.USER }]).buildWithId(
				{
					firstName: 'existingFirstName',
					preferredName: 'existingPreferredName',
					lastName: 'existingLastName',
					email: 'existingEmail',
					schoolId: 'existingSchoolId',
					externalId: 'externalUserId',
					birthday: new Date('2023-11-16'),
				},
				'userId'
			);
			const savedUser = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).buildWithId(
				{
					firstName: 'firstName',
					preferredName: 'preferredName',
					lastName: 'lastName',
					email: 'email',
					schoolId,
					externalId: 'externalUserId',
					birthday,
				},
				'userId'
			);
			const externalUser = externalUserDtoFactory.build({
				externalId: 'externalUserId',
				firstName: 'firstName',
				preferredName: 'preferredName',
				lastName: 'lastName',
				email: 'email',
				roles: [RoleName.USER],
				birthday,
			});
			const minimalViableExternalUser = new ExternalUserDto({
				externalId: 'externalUserId',
				roles: [RoleName.USER],
			});
			const userRole = new RoleDto({
				id: new ObjectId().toHexString(),
				name: RoleName.USER,
			});

			roleService.findByNames.mockResolvedValue([userRole]);
			userService.save.mockResolvedValue(savedUser);

			return {
				existingUser,
				savedUser,
				externalUser,
				minimalViableExternalUser,
				userRole,
				schoolId,
				systemId,
			};
		};

		describe('when the user has no role', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const externalUser = externalUserDtoFactory.build({
					roles: [],
				});

				return {
					systemId,
					schoolId,
					externalUser,
				};
			};

			it('should throw UserRoleUnknownLoggableException', async () => {
				const { externalUser, schoolId, systemId } = setup();

				await expect(service.provisionExternalUser(externalUser, systemId, schoolId)).rejects.toThrow(
					UserRoleUnknownLoggableException
				);
			});
		});

		describe('when the user does not exist yet', () => {
			describe('when the external user has no email', () => {
				it('should return the saved user', async () => {
					const { minimalViableExternalUser, schoolId, savedUser, systemId } = setupUser();

					userService.findByExternalId.mockResolvedValue(null);

					const result = await service.provisionExternalUser(minimalViableExternalUser, systemId, schoolId);

					expect(result).toEqual(savedUser);
				});
			});

			it('should return the saved user', async () => {
				const { externalUser, schoolId, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(null);

				const result = await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(result).toEqual(savedUser);
			});

			it('should create a new account', async () => {
				const { externalUser, schoolId, systemId } = setupUser();
				const account = {
					userId: 'userId',
					username: crypto.createHash('sha256').update('userId').digest('base64'),
					systemId,
					activated: true,
				} as AccountSave;

				userService.findByExternalId.mockResolvedValue(null);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(accountService.saveWithValidation).toHaveBeenCalledWith(account);
			});

			describe('when no schoolId is provided', () => {
				it('should throw SchoolMissingLoggableException', async () => {
					const { externalUser } = setupUser();

					userService.findByExternalId.mockResolvedValue(null);

					const promise = service.provisionExternalUser(externalUser, 'systemId', undefined);

					await expect(promise).rejects.toThrow(SchoolMissingLoggableException);
				});
			});
		});

		describe('when the user already exists', () => {
			it('should call the user service to save the user', async () => {
				const { externalUser, schoolId, existingUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);

				await service.provisionExternalUser(externalUser, systemId, schoolId);

				expect(userService.save).toHaveBeenCalledWith(existingUser);
			});

			it('should return the updated user', async () => {
				const { externalUser, schoolId, existingUser, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(existingUser);

				const result = await service.provisionExternalUser(externalUser, systemId, schoolId);

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
