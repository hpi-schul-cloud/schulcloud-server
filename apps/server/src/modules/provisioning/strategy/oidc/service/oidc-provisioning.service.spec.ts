import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, SchoolFeatures } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { federalStateFactory, schoolDOFactory, userDoFactory } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { FederalStateService, SchoolService, SchoolYearService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import { ExternalSchoolDto, ExternalUserDto } from '../../../dto';
import { OidcProvisioningService } from './oidc-provisioning.service';

jest.mock('crypto-js');

describe('OidcProvisioningService', () => {
	let module: TestingModule;
	let service: OidcProvisioningService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let federalStateService: DeepMocked<FederalStateService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OidcProvisioningService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
				{
					provide: FederalStateService,
					useValue: createMock<FederalStateService>(),
				},
			],
		}).compile();

		service = module.get(OidcProvisioningService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
		schoolYearService = module.get(SchoolYearService);
		federalStateService = module.get(FederalStateService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalSchool is called', () => {
		const setup = () => {
			const systemId = 'systemId';
			const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
				externalId: 'externalId',
				name: 'name',
				officialSchoolNumber: 'officialSchoolNumber',
			});
			const savedSchoolDO = schoolDOFactory.build({
				id: 'schoolId',
				externalId: 'externalId',
				name: 'name',
				officialSchoolNumber: 'officialSchoolNumber',
				systems: [systemId],
				features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
			});
			const existingSchoolDO = schoolDOFactory.build({
				id: 'schoolId',
				externalId: 'externalId',
				name: 'existingName',
				officialSchoolNumber: 'existingOfficialSchoolNumber',
				systems: [systemId],
				features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
			});

			schoolService.createOrUpdateSchool.mockResolvedValue(savedSchoolDO);
			schoolService.getSchoolByExternalId.mockResolvedValue(null);
			schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYearFactory.build());
			federalStateService.findFederalStateByName.mockResolvedValue(federalStateFactory.build());

			return {
				systemId,
				externalSchoolDto,
				savedSchoolDO,
				existingSchoolDO,
			};
		};

		describe('when systemId is given and external school does not exist', () => {
			it('should save the new school', async () => {
				const { systemId, externalSchoolDto, savedSchoolDO } = setup();

				const result: SchoolDO = await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(result).toEqual(savedSchoolDO);
			});
		});

		describe('when external school already exist', () => {
			it('should update the existing school', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				const result: SchoolDO = await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(result).toEqual(savedSchoolDO);
			});

			it('should append the new system', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();
				const otherSystemId = 'otherSystemId';
				existingSchoolDO.systems = [otherSystemId];

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(schoolService.createOrUpdateSchool).toHaveBeenCalledWith({
					...savedSchoolDO,
					systems: [otherSystemId, systemId],
				});
			});

			it('should create a new system list', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();
				existingSchoolDO.systems = undefined;

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(schoolService.createOrUpdateSchool).toHaveBeenCalledWith(savedSchoolDO);
			});
		});
	});

	describe('provisionExternalUser is called', () => {
		const setupUser = () => {
			const systemId = 'systemId';
			const schoolId = 'schoolId';
			const existingUser: UserDO = userDoFactory.withRoles([{ id: 'existingRoleId', name: RoleName.USER }]).buildWithId(
				{
					firstName: 'existingFirstName',
					lastName: 'existingLastName',
					email: 'existingEmail',
					schoolId: 'existingSchoolId',
					externalId: 'externalUserId',
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
				},
				'userId'
			);
			const externalUser: ExternalUserDto = new ExternalUserDto({
				externalId: 'externalUserId',
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				roles: [RoleName.USER],
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
			it('should call the user service to save the user', async () => {
				const { externalUser, schoolId, savedUser, systemId } = setupUser();

				userService.findByExternalId.mockResolvedValue(null);

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
				const account: AccountSaveDto = new AccountSaveDto({
					userId: 'userId',
					username: hash,
					systemId,
					activated: true,
				});

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
