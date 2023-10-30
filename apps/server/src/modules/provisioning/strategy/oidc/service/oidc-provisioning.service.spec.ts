import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource, LegacySchoolDo, RoleName, RoleReference, SchoolFeatures } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import {
	externalGroupDtoFactory,
	federalStateFactory,
	groupFactory,
	roleDtoFactory,
	legacySchoolDoFactory,
	schoolYearFactory,
	userDoFactory,
	roleFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { Group, GroupService } from '@src/modules/group';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { FederalStateService, LegacySchoolService, SchoolYearService } from '@src/modules/legacy-school';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
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
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionExternalSchool', () => {
		const setup = () => {
			const systemId = 'systemId';
			const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
				externalId: 'externalId',
				name: 'name',
				officialSchoolNumber: 'officialSchoolNumber',
			});
			const savedSchoolDO = legacySchoolDoFactory.build({
				id: 'schoolId',
				externalId: 'externalId',
				name: 'name',
				officialSchoolNumber: 'officialSchoolNumber',
				systems: [systemId],
				features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
			});
			const existingSchoolDO = legacySchoolDoFactory.build({
				id: 'schoolId',
				externalId: 'externalId',
				name: 'existingName',
				officialSchoolNumber: 'existingOfficialSchoolNumber',
				systems: [systemId],
				features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
			});

			schoolService.save.mockResolvedValue(savedSchoolDO);
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

				const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(result).toEqual(savedSchoolDO);
			});
		});

		describe('when external school already exist', () => {
			it('should update the existing school', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				const result: LegacySchoolDo = await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(result).toEqual(savedSchoolDO);
			});

			it('should append the new system', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();
				const otherSystemId = 'otherSystemId';
				existingSchoolDO.systems = [otherSystemId];

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(schoolService.save).toHaveBeenCalledWith(
					{
						...savedSchoolDO,
						systems: [otherSystemId, systemId],
					},
					true
				);
			});

			it('should create a new system list', async () => {
				const { systemId, externalSchoolDto, existingSchoolDO, savedSchoolDO } = setup();
				existingSchoolDO.systems = undefined;

				schoolService.getSchoolByExternalId.mockResolvedValue(existingSchoolDO);

				await service.provisionExternalSchool(externalSchoolDto, systemId);

				expect(schoolService.save).toHaveBeenCalledWith(
					{
						...savedSchoolDO,
						federalState: {
							...savedSchoolDO.federalState,
							createdAt: expect.any(Date),
							updatedAt: expect.any(Date),
						},
						inMaintenanceSince: expect.any(Date),
					},
					true
				);
			});
		});
	});

	describe('provisionExternalUser', () => {
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

	describe('provisionExternalGroup', () => {
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
					users: [{ externalUserId, roleName: role.name }],
				});
				const secondExternalGroup: ExternalGroupDto = externalGroupDtoFactory.build({
					externalId: existingGroups[1].externalSource?.externalId,
					users: [{ externalUserId, roleName: role.name }],
				});
				const externalGroups: ExternalGroupDto[] = [firstExternalGroup, secondExternalGroup];

				userService.findByExternalId.mockResolvedValue(user);
				groupService.findByUser.mockResolvedValue(existingGroups);

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
						users: [{ externalUserId, roleName: role.name }],
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findByUser.mockResolvedValue(existingGroups);

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
						users: [{ externalUserId, roleName: role.name }],
					});
					const externalGroups: ExternalGroupDto[] = [firstExternalGroup];

					userService.findByExternalId.mockResolvedValue(user);
					groupService.findByUser.mockResolvedValue(existingGroups);

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

				await expect(func).rejects.toThrow(new NotFoundLoggableException('User', 'externalId', externalUserId));
			});
		});

		describe('when the group has no users', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({ users: [] });

				return {
					externalGroupDto,
				};
			};

			it('should not create a group', async () => {
				const { externalGroupDto } = setup();

				await service.provisionExternalGroup(externalGroupDto, 'systemId');

				expect(groupService.save).not.toHaveBeenCalled();
			});
		});

		describe('when group does not have an externalOrganizationId', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({ externalOrganizationId: undefined });

				return {
					externalGroupDto,
				};
			};

			it('should not call schoolService.getSchoolByExternalId', async () => {
				const { externalGroupDto } = setup();

				await service.provisionExternalGroup(externalGroupDto, 'systemId');

				expect(schoolService.getSchoolByExternalId).not.toHaveBeenCalled();
			});
		});

		describe('when school for group could not be found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({ externalOrganizationId: 'orgaId' });
				const systemId = 'systemId';
				schoolService.getSchoolByExternalId.mockResolvedValueOnce(null);

				return {
					externalGroupDto,
					systemId,
				};
			};

			it('should log a SchoolForGroupNotFoundLoggable', async () => {
				const { externalGroupDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, systemId);

				expect(logger.info).toHaveBeenCalledWith(new SchoolForGroupNotFoundLoggable(externalGroupDto));
			});

			it('should not call groupService.save', async () => {
				const { externalGroupDto, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, systemId);

				expect(groupService.save).not.toHaveBeenCalled();
			});
		});

		describe('when externalGroup has no users', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					users: [],
				});

				return {
					externalGroupDto,
				};
			};

			it('should not call userService.findByExternalId', async () => {
				const { externalGroupDto } = setup();

				await service.provisionExternalGroup(externalGroupDto, 'systemId');

				expect(userService.findByExternalId).not.toHaveBeenCalled();
			});

			it('should not call roleService.findByNames', async () => {
				const { externalGroupDto } = setup();

				await service.provisionExternalGroup(externalGroupDto, 'systemId');

				expect(roleService.findByNames).not.toHaveBeenCalled();
			});
		});

		describe('when externalGroupUser could not been found', () => {
			const setup = () => {
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build();
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

				await service.provisionExternalGroup(externalGroupDto, systemId);

				expect(logger.info).toHaveBeenCalledWith(new UserForGroupNotFoundLoggable(externalGroupDto.users[0]));
			});
		});

		describe('when provision group', () => {
			const setup = () => {
				const group: Group = groupFactory.build({ users: [] });
				groupService.findByExternalSource.mockResolvedValue(group);

				const school: LegacySchoolDo = legacySchoolDoFactory.build({ id: 'schoolId' });
				schoolService.getSchoolByExternalId.mockResolvedValue(school);

				const student: UserDO = userDoFactory
					.withRoles([{ id: 'studentRoleId', name: RoleName.STUDENT }])
					.build({ id: 'studentId', externalId: 'studentExternalId' });
				const teacher: UserDO = userDoFactory
					.withRoles([{ id: 'teacherRoleId', name: RoleName.TEACHER }])
					.build({ id: 'teacherId', externalId: 'teacherExternalId' });
				userService.findByExternalId.mockResolvedValueOnce(student);
				userService.findByExternalId.mockResolvedValueOnce(teacher);
				const studentRole: RoleDto = roleDtoFactory.build({ name: RoleName.STUDENT });
				const teacherRole: RoleDto = roleDtoFactory.build({ name: RoleName.TEACHER });
				roleService.findByNames.mockResolvedValueOnce([studentRole]);
				roleService.findByNames.mockResolvedValueOnce([teacherRole]);
				const externalGroupDto: ExternalGroupDto = externalGroupDtoFactory.build({
					users: [
						{
							externalUserId: student.externalId as string,
							roleName: RoleName.STUDENT,
						},
						{
							externalUserId: teacher.externalId as string,
							roleName: RoleName.TEACHER,
						},
					],
				});
				const systemId = 'systemId';

				return {
					externalGroupDto,
					school,
					student,
					teacher,
					studentRole,
					teacherRole,
					systemId,
				};
			};

			it('should save a new group', async () => {
				const { externalGroupDto, school, student, studentRole, teacher, teacherRole, systemId } = setup();

				await service.provisionExternalGroup(externalGroupDto, systemId);

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
	});
});
