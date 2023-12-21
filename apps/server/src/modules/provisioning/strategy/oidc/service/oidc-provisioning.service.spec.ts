import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account/services/account.service';
import { AccountSaveDto } from '@modules/account/services/dto';
import { Group, GroupService, GroupTypes } from '@modules/group';
import {
	FederalStateService,
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchoolYearService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserService } from '@modules/user';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ExternalSource, LegacySchoolDo, RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import {
	externalGroupDtoFactory,
	externalSchoolDtoFactory,
	federalStateFactory,
	groupFactory,
	legacySchoolDoFactory,
	roleDtoFactory,
	roleFactory,
	schoolYearFactory,
	userDoFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import CryptoJS from 'crypto-js';
import { ExternalGroupDto, ExternalSchoolDto, ExternalUserDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';
import { OidcProvisioningService } from './oidc-provisioning.service';

jest.mock('crypto-js');

describe('OidcProvisioningService', () => {
	let module: TestingModule;
	let service: OidcProvisioningService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;
	let schoolYearService: DeepMocked<SchoolYearService>;
	let federalStateService: DeepMocked<FederalStateService>;
	let groupService: DeepMocked<GroupService>;
	let schoolSystemOptionsService: DeepMocked<SchoolSystemOptionsService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OidcProvisioningService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
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
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(OidcProvisioningService);
		userService = module.get(UserService);
		schoolService = module.get(LegacySchoolService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);
		schoolYearService = module.get(SchoolYearService);
		federalStateService = module.get(FederalStateService);
		groupService = module.get(GroupService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalSchool', () => {
		describe('when systemId is given and external school does not exist', () => {
			describe('when successful', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should save the correct data', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});

				it('should save the new school', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(result).toEqual(savedSchoolDO);
				});
			});

			describe('when the external system provides a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						location: 'Hannover',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name (Hannover)',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should append it to the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});
			});

			describe('when the external system does not provide a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = new LegacySchoolDo({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(null);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
					};
				};

				it('should only use the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith({ ...savedSchoolDO, id: undefined }, true);
				});
			});
		});

		describe('when external school already exists', () => {
			describe('when successful', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should update the existing school', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(result).toEqual(savedSchoolDO);
				});
			});

			describe('when the external system provides a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						location: 'Hannover',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name (Hannover)',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should append it to the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});

			describe('when the external system does not provide a location for the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should only use the school name', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});

			describe('when there is a system at the school', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const otherSystemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [otherSystemId, systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: [otherSystemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						otherSystemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should append the new system', async () => {
					const { systemId, otherSystemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(
						{
							...savedSchoolDO,
							systems: [otherSystemId, systemId],
						},
						true
					);
				});
			});

			describe('when there is no system at the school yet', () => {
				const setup = () => {
					const systemId = new ObjectId().toHexString();
					const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
					});

					const schoolYear = schoolYearFactory.build();
					const federalState = federalStateFactory.build();
					const savedSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'name',
						officialSchoolNumber: 'officialSchoolNumber',
						systems: [systemId],
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});
					const existingSchoolDO = legacySchoolDoFactory.build({
						id: 'schoolId',
						externalId: 'externalId',
						name: 'existingName',
						officialSchoolNumber: 'existingOfficialSchoolNumber',
						systems: undefined,
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
						schoolYear,
						federalState,
					});

					schoolService.save.mockResolvedValue(savedSchoolDO);
					schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);
					schoolYearService.getCurrentSchoolYear.mockResolvedValue(schoolYear);
					federalStateService.findFederalStateByName.mockResolvedValue(federalState);

					return {
						systemId,
						externalSchoolDto,
						savedSchoolDO,
						existingSchoolDO,
					};
				};

				it('should create a new system list', async () => {
					const { systemId, externalSchoolDto, savedSchoolDO } = setup();

					await service.provisionExternalSchool(externalSchoolDto, systemId);

					expect(schoolService.save).toHaveBeenCalledWith(savedSchoolDO, true);
				});
			});
		});
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

	describe('filterExternalGroups', () => {
		describe('when all options are on', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should load the configured options from the school', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(schoolSystemOptionsService.getProvisioningOptions).toHaveBeenCalledWith(
					SchulConneXProvisioningOptions,
					schoolId,
					systemId
				);
			});

			it('should not filter', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([classGroup, courseGroup, otherGroup]);
			});
		});

		describe('when only classes are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: false,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for classes', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([classGroup]);
			});
		});

		describe('when only courses are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: false,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for courses', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([courseGroup]);
			});
		});

		describe('when only other groups are active', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(
					new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: true,
					})
				);

				return {
					schoolId,
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should filter for other groups', async () => {
				const { schoolId, systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], schoolId, systemId);

				expect(result).toEqual([otherGroup]);
			});
		});

		describe('when no schoolId was provided', () => {
			const setup = () => {
				const systemId: EntityId = new ObjectId().toHexString();

				const classGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.CLASS,
				});
				const courseGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.COURSE,
				});
				const otherGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					type: GroupTypes.OTHER,
				});

				return {
					systemId,
					classGroup,
					courseGroup,
					otherGroup,
				};
			};

			it('should use the default option', async () => {
				const { systemId, classGroup, courseGroup, otherGroup } = setup();

				const result = await service.filterExternalGroups([classGroup, courseGroup, otherGroup], undefined, systemId);

				expect(result).toEqual([classGroup]);
			});
		});
	});

	describe('provisionExternalGroup', () => {
		describe('when school for group could not be found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();
				const externalSchoolDto: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const systemId = 'systemId';
				schoolService.getSchoolByExternalId.mockResolvedValueOnce(null);

				return {
					externalSchoolDto,
					externalGroupDto,
					systemId,
				};
			};

			it('should log a SchoolForGroupNotFoundLoggable', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(logger.info).toHaveBeenCalledWith(
					new SchoolForGroupNotFoundLoggable(externalGroupDto, externalSchoolDto)
				);
			});

			it('should not call groupService.save', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(groupService.save).not.toHaveBeenCalled();
			});
		});

		describe('when the user cannot be found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({ otherUsers: undefined });
				const systemId = 'systemId';
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				userService.findByExternalId.mockResolvedValue(null);
				schoolService.getSchoolByExternalId.mockResolvedValue(school);

				return {
					externalGroupDto,
					systemId,
				};
			};

			it('should log a UserForGroupNotFoundLoggable', async () => {
				const { externalGroupDto, systemId } = setup();

				await expect(service.provisionExternalGroup(externalGroupDto, undefined, systemId)).rejects.toThrow();

				expect(logger.info).toHaveBeenCalledWith(new UserForGroupNotFoundLoggable(externalGroupDto.user));
			});

			it('should throw a not found exception', async () => {
				const { externalGroupDto, systemId } = setup();

				await expect(service.provisionExternalGroup(externalGroupDto, undefined, systemId)).rejects.toThrow(
					NotFoundLoggableException
				);
			});
		});

		describe('when provisioning a new group with other group members', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: 'schoolId' });
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.TEACHER }])
					.build({ id: new ObjectId().toHexString(), externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ name: RoleName.TEACHER });
				const externalSchoolDto: ExternalSchoolDto = externalSchoolDtoFactory.build();
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: [
						{
							externalUserId: teacher.externalId as string,
							roleName: RoleName.TEACHER,
						},
					],
				});
				const systemId = new ObjectId().toHexString();

				schoolService.getSchoolByExternalId.mockResolvedValueOnce(school);
				groupService.findByExternalSource.mockResolvedValueOnce(null);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);
				userService.findByExternalId.mockResolvedValueOnce(teacher);
				roleService.findByNames.mockResolvedValueOnce([teacherRole]);

				return {
					externalSchoolDto,
					externalGroupDto,
					school,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
				};
			};

			it('should use the correct school', async () => {
				const { externalGroupDto, externalSchoolDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(schoolService.getSchoolByExternalId).toHaveBeenCalledWith(externalSchoolDto.externalId, systemId);
			});

			it('should save a new group', async () => {
				const { externalGroupDto, externalSchoolDto, school, student, studentRole, teacher, teacherRole, systemId } =
					setup();

				await service.provisionExternalGroup(externalGroupDto, externalSchoolDto, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: expect.any(String),
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
						},
						type: externalGroupDto.type,
						organizationId: school.id,
						validFrom: externalGroupDto.from,
						validUntil: externalGroupDto.until,
						users: [
							{
								userId: student.id,
								roleId: studentRole.id,
							},
							{
								userId: teacher.id,
								roleId: teacherRole.id,
							},
						],
					},
				});
			});
		});

		describe('when provisioning an existing group without other group members', () => {
			const setup = () => {
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: undefined,
				});
				const group: Group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
				const systemId = new ObjectId().toHexString();

				groupService.findByExternalSource.mockResolvedValueOnce(group);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);

				return {
					externalGroupDto,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
					group,
				};
			};

			it('should update the group and only add the user', async () => {
				const { externalGroupDto, student, studentRole, teacher, teacherRole, systemId, group } = setup();

				await service.provisionExternalGroup(externalGroupDto, undefined, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: group.id,
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
						},
						type: externalGroupDto.type,
						organizationId: undefined,
						validFrom: externalGroupDto.from,
						validUntil: externalGroupDto.until,
						users: [
							{
								userId: teacher.id,
								roleId: teacherRole.id,
							},
							{
								userId: student.id,
								roleId: studentRole.id,
							},
						],
					},
				});
			});
		});

		describe('when provisioning an existing group with empty other group members', () => {
			const setup = () => {
				const student: UserDO = userDoFactory
					.withRoles([{ id: new ObjectId().toHexString(), name: RoleName.STUDENT }])
					.build({ id: new ObjectId().toHexString(), externalId: 'studentExternalId' });
				const teacherId = new ObjectId().toHexString();
				const teacherRoleId = new ObjectId().toHexString();
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: teacherRoleId, name: RoleName.TEACHER }])
					.build({ id: teacherId, externalId: 'teacherExternalId' });
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ id: teacherRoleId, name: RoleName.TEACHER });
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					user: {
						externalUserId: student.externalId as string,
						roleName: RoleName.STUDENT,
					},
					otherUsers: [],
				});
				const group: Group = groupFactory.build({ users: [{ userId: teacherId, roleId: teacherRoleId }] });
				const systemId = new ObjectId().toHexString();

				groupService.findByExternalSource.mockResolvedValueOnce(group);
				userService.findByExternalId.mockResolvedValueOnce(student);
				roleService.findByNames.mockResolvedValueOnce([studentRole]);

				return {
					externalGroupDto,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
					group,
				};
			};

			it('should update the group with all users', async () => {
				const { externalGroupDto, student, studentRole, systemId, group } = setup();

				await service.provisionExternalGroup(externalGroupDto, undefined, systemId);

				expect(groupService.save).toHaveBeenCalledWith({
					props: {
						id: group.id,
						name: externalGroupDto.name,
						externalSource: {
							externalId: externalGroupDto.externalId,
							systemId,
						},
						type: externalGroupDto.type,
						organizationId: undefined,
						validFrom: externalGroupDto.from,
						validUntil: externalGroupDto.until,
						users: [
							{
								userId: student.id,
								roleId: studentRole.id,
							},
						],
					},
				});
			});
		});
	});

	describe('removeExternalGroupsAndAffiliation', () => {
		describe('when group membership of user has not changed', () => {
			const setup = () => {
				const systemId = 'systemId';
				const externalUserId = 'externalUserId';
				const role: RoleReference = roleFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });

				const existingGroups: Group[] = groupFactory.buildList(2, {
					users: [{ userId: user.id as string, roleId: role.id }],
				});

				const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					externalId: existingGroups[0].externalSource?.externalId,
					user: { externalUserId, roleName: role.name },
				});
				const secondExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					externalId: existingGroups[1].externalSource?.externalId,
					user: { externalUserId, roleName: role.name },
				});
				const externalGroups: ExternalGroupDto[] = [firstExternalGroup, secondExternalGroup];

				userService.findByExternalId.mockResolvedValue(user);
				groupService.findGroupsByUserAndGroupTypes.mockResolvedValue(existingGroups);

				return {
					externalGroups,
					systemId,
					externalUserId,
				};
			};

			it('should not save the group', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				expect(groupService.save).not.toHaveBeenCalled();
			});

			it('should not delete the group', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				expect(groupService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when user is not part of a group anymore', () => {
			describe('when group is empty after removal of the User', () => {
				const setup = () => {
					const systemId = 'systemId';
					const externalUserId = 'externalUserId';
					const role: RoleReference = roleFactory.buildWithId();
					const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });

					const firstExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-1',
							systemId,
						}),
					});
					const secondExistingGroup: Group = groupFactory.build({
						users: [{ userId: user.id as string, roleId: role.id }],
						externalSource: new ExternalSource({
							externalId: 'externalId-2',
							systemId,
						}),
					});
					const existingGroups = [firstExistingGroup, secondExistingGroup];

					const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
						externalId: existingGroups[0].externalSource?.externalId,
						user: { externalUserId, roleName: role.name },
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findGroupsByUserAndGroupTypes.mockResolvedValue(existingGroups);

					return {
						externalGroups,
						systemId,
						externalUserId,
						existingGroups,
					};
				};

				it('should delete the group', async () => {
					const { externalGroups, systemId, externalUserId, existingGroups } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.delete).toHaveBeenCalledWith(existingGroups[1]);
				});

				it('should not save the group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.save).not.toHaveBeenCalled();
				});
			});

			describe('when group is not empty after removal of the User', () => {
				const setup = () => {
					const systemId = 'systemId';
					const externalUserId = 'externalUserId';
					const anotherExternalUserId = 'anotherExternalUserId';
					const role: RoleReference = roleFactory.buildWithId();
					const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
					const anotherUser: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: anotherExternalUserId });

					const firstExistingGroup: Group = groupFactory.build({
						users: [
							{ userId: user.id as string, roleId: role.id },
							{ userId: anotherUser.id as string, roleId: role.id },
						],
						externalSource: new ExternalSource({
							externalId: `externalId-1`,
							systemId,
						}),
					});

					const secondExistingGroup: Group = groupFactory.build({
						users: [
							{ userId: user.id as string, roleId: role.id },
							{ userId: anotherUser.id as string, roleId: role.id },
						],
						externalSource: new ExternalSource({
							externalId: `externalId-2`,
							systemId,
						}),
					});

					const existingGroups: Group[] = [firstExistingGroup, secondExistingGroup];

					const firstExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
						externalId: existingGroups[0].externalSource?.externalId,
						user: { externalUserId, roleName: role.name },
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findGroupsByUserAndGroupTypes.mockResolvedValue(existingGroups);

					return {
						externalGroups,
						systemId,
						externalUserId,
						existingGroups,
					};
				};

				it('should save the group', async () => {
					const { externalGroups, systemId, externalUserId, existingGroups } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.save).toHaveBeenCalledWith(existingGroups[1]);
				});

				it('should not delete the group', async () => {
					const { externalGroups, systemId, externalUserId } = setup();

					await service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

					expect(groupService.delete).not.toHaveBeenCalled();
				});
			});
		});

		describe('when user could not be found', () => {
			const setup = () => {
				const systemId = 'systemId';
				const externalUserId = 'externalUserId';
				const externalGroups: ExternalGroupDto[] = [externalGroupDtoFactory.build()];

				userService.findByExternalId.mockResolvedValue(null);

				return {
					systemId,
					externalUserId,
					externalGroups,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { externalGroups, systemId, externalUserId } = setup();

				const func = async () => service.removeExternalGroupsAndAffiliation(externalUserId, externalGroups, systemId);

				await expect(func).rejects.toThrow(new NotFoundLoggableException('User', { externalId: externalUserId }));
			});
		});
	});
});
