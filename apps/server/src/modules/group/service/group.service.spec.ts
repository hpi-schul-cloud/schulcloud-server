import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import type { ProvisioningConfig } from '@modules/provisioning';
import { RoleDto, RoleService } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { UserService } from '@modules/user';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, RoleName, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { userDoFactory } from '@testing/factory/user.do.factory';
import { userFactory } from '@testing/factory/user.factory';
import { setupEntities } from '@testing/setup-entities';
import { Group, GroupAggregateScope, GroupDeletedEvent, GroupTypes, GroupVisibilityPermission } from '../domain';
import { GroupRepo } from '../repo';
import { groupFactory } from '../testing';
import { GroupService } from './group.service';

describe('GroupService', () => {
	let module: TestingModule;
	let service: GroupService;
	let roleService: DeepMocked<RoleService>;
	let userService: DeepMocked<UserService>;
	let groupRepo: DeepMocked<GroupRepo>;
	let eventBus: DeepMocked<EventBus>;
	let configService: DeepMocked<ConfigService<ProvisioningConfig, true>>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				GroupService,
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(GroupService);
		roleService = module.get(RoleService);
		userService = module.get(UserService);
		groupRepo = module.get(GroupRepo);
		eventBus = module.get(EventBus);
		configService = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group = await service.findById(group.id);

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { group } = setup();

				const func = () => service.findById(group.id);

				await expect(func).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('tryFindById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.tryFindById(group.id);

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should return null', async () => {
				const { group } = setup();

				const result: Group | null = await service.tryFindById(group.id);

				expect(result).toBeNull();
			});
		});
	});

	describe('findGroups', () => {
		describe('when groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();
				const nameQuery = 'name';
				const groups: Group[] = groupFactory.buildList(2);
				const page: Page<Group> = new Page<Group>(groups, groups.length);

				groupRepo.findGroups.mockResolvedValue(page);

				return {
					userId,
					schoolId,
					systemId,
					nameQuery,
					groups,
				};
			};

			it('should return the groups for the user', async () => {
				const { userId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ userId });

				expect(result.data).toEqual(groups);
			});

			it('should return the groups for school', async () => {
				const { schoolId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId });

				expect(result.data).toEqual(groups);
			});

			it('should return the groups for school and system', async () => {
				const { schoolId, systemId, groups } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId, systemId });

				expect(result.data).toEqual(groups);
			});

			it('should call the repo with all given arguments', async () => {
				const { userId, schoolId, systemId, nameQuery } = setup();

				await service.findGroups({
					userId,
					schoolId,
					systemId,
					nameQuery,
					groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
				});

				expect(groupRepo.findGroups).toHaveBeenCalledWith(
					{
						userId,
						schoolId,
						systemId,
						nameQuery,
						groupTypes: [GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					},
					undefined
				);
			});
		});

		describe('when no groups exist', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();
				const systemId: EntityId = new ObjectId().toHexString();

				groupRepo.findGroups.mockResolvedValue(new Page<Group>([], 0));

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should return empty array for user', async () => {
				const { userId } = setup();

				const result: Page<Group> = await service.findGroups({ userId });

				expect(result.data).toEqual([]);
			});

			it('should return empty array for school', async () => {
				const { schoolId } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId });

				expect(result.data).toEqual([]);
			});

			it('should return empty array for school and system', async () => {
				const { schoolId, systemId } = setup();

				const result: Page<Group> = await service.findGroups({ schoolId, systemId });

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('findGroupsForUser', () => {
		describe('when available groups exist and the feature is enabled', () => {
			const setup = () => {
				const user = userFactory.buildWithId({ school: schoolEntityFactory.buildWithId() });
				const nameQuery = 'name';
				const groups: Group[] = groupFactory.buildList(2);

				const options: IFindOptions<Group> = {
					pagination: {
						skip: 1,
						limit: 1,
					},
					order: {
						name: SortOrder.asc,
					},
				};

				configService.get.mockReturnValueOnce(true);
				groupRepo.findGroupsForScope.mockResolvedValueOnce(new Page<Group>(groups, 2));

				return {
					user,
					nameQuery,
					groups,
					options,
				};
			};

			it('should call repo', async () => {
				const { user, nameQuery, options } = setup();

				await service.findGroupsForUser(user, GroupVisibilityPermission.ALL_SCHOOL_GROUPS, true, nameQuery, options);

				expect(groupRepo.findGroupsForScope).toHaveBeenCalledWith(
					new GroupAggregateScope(options).byName(nameQuery).byAvailableForSync(true).byOrganization(user.school.id)
				);
			});

			it('should return the groups', async () => {
				const { user, groups, nameQuery, options } = setup();

				const result: Page<Group> = await service.findGroupsForUser(
					user,
					GroupVisibilityPermission.ALL_SCHOOL_GROUPS,
					true,
					nameQuery,
					options
				);

				expect(result.data).toEqual(groups);
			});
		});

		describe('when available groups exist but the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const groups: Group[] = groupFactory.buildList(2);

				configService.get.mockReturnValueOnce(false);
				groupRepo.findGroupsForScope.mockResolvedValueOnce(new Page<Group>(groups, 2));

				return {
					user,
					groups,
				};
			};

			it('should call repo', async () => {
				const { user } = setup();

				await service.findGroupsForUser(user, GroupVisibilityPermission.ALL_SCHOOL_GROUPS, true);

				expect(groupRepo.findGroupsForScope).toHaveBeenCalledWith(
					new GroupAggregateScope().byOrganization(user.school.id)
				);
			});

			it('should return the groups', async () => {
				const { user, groups } = setup();

				const result: Page<Group> = await service.findGroupsForUser(
					user,
					GroupVisibilityPermission.ALL_SCHOOL_GROUPS,
					true
				);

				expect(result.data).toEqual(groups);
			});
		});

		describe('when no groups exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				groupRepo.findGroupsForScope.mockResolvedValueOnce(new Page<Group>([], 0));

				return {
					user,
				};
			};

			it('should call repo', async () => {
				const { user } = setup();

				await service.findGroupsForUser(user, GroupVisibilityPermission.OWN_GROUPS, false);

				expect(groupRepo.findGroupsForScope).toHaveBeenCalledWith(new GroupAggregateScope().byUser(user.id));
			});

			it('should return an empty array', async () => {
				const { user } = setup();

				const result: Page<Group> = await service.findGroupsForUser(user, GroupVisibilityPermission.OWN_GROUPS, false);

				expect(result.data).toEqual([]);
			});
		});
	});

	describe('save', () => {
		describe('when saving a group', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.save.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should call repo.save', async () => {
				const { group } = setup();

				await service.save(group);

				expect(groupRepo.save).toHaveBeenCalledWith(group);
			});

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.save(group);

				expect(result).toEqual(group);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting a group', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				return {
					group,
				};
			};

			it('should call repo.delete', async () => {
				const { group } = setup();

				await service.delete(group);

				expect(groupRepo.delete).toHaveBeenCalledWith(group);
			});

			it('should send an event', async () => {
				const { group } = setup();

				await service.delete(group);

				expect(eventBus.publish).toHaveBeenCalledWith(new GroupDeletedEvent(group));
			});
		});
	});

	describe('findByExternalSource', () => {
		describe('when a group with the externalId exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findByExternalSource.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = setup();

				const result: Group | null = await service.findByExternalSource('externalId', 'systemId');

				expect(result).toEqual(group);
			});
		});

		describe('when a group with the externalId does not exists', () => {
			const setup = () => {
				groupRepo.findByExternalSource.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result: Group | null = await service.findByExternalSource('externalId', 'systemId');

				expect(result).toBeNull();
			});
		});
	});

	describe('createGroup', () => {
		describe('when creating a group with a school', () => {
			it('should call repo.save', async () => {
				await service.createGroup('name', GroupTypes.CLASS, 'schoolId');

				expect(groupRepo.save).toHaveBeenCalledWith(expect.any(Group));
			});

			it('should save the group properties', async () => {
				await service.createGroup('name', GroupTypes.CLASS, 'schoolId');

				expect(groupRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({ name: 'name', type: GroupTypes.CLASS, organizationId: 'schoolId' })
				);
			});
		});
	});

	describe('addUserToGroup', () => {
		const setup = () => {
			const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
			roleService.findByName.mockResolvedValue(roleDto);

			const userDo = userDoFactory.build();
			userService.findById.mockResolvedValue(userDo);

			const group = groupFactory.build();
			groupRepo.findGroupById.mockResolvedValue(group);

			return { group, userDo, roleDto };
		};

		describe('when adding a user to a group', () => {
			it('should call roleService.findByName', async () => {
				setup();
				await service.addUserToGroup('groupId', 'userId', RoleName.STUDENT);

				expect(roleService.findByName).toHaveBeenCalledWith(RoleName.STUDENT);
			});

			it('should call userService.findById', async () => {
				setup();
				await service.addUserToGroup('groupId', 'userId', RoleName.STUDENT);

				expect(userService.findById).toHaveBeenCalledWith('userId');
			});

			it('should call groupRepo.findGroupById', async () => {
				setup();
				await service.addUserToGroup('groupId', 'userId', RoleName.STUDENT);

				expect(groupRepo.findGroupById).toHaveBeenCalledWith('groupId');
			});

			it('should call group.addUser', async () => {
				const { group, userDo, roleDto } = setup();
				jest.spyOn(group, 'addUser');
				await service.addUserToGroup('groupId', 'userId', RoleName.STUDENT);

				expect(group.addUser).toHaveBeenCalledWith(expect.objectContaining({ userId: userDo.id, roleId: roleDto.id }));
			});

			it('should call groupRepo.save', async () => {
				const { group } = setup();
				await service.addUserToGroup('groupId', 'userId', RoleName.STUDENT);

				expect(groupRepo.save).toHaveBeenCalledWith(group);
			});
		});
	});

	describe('addUsersToGroup', () => {
		const setup = (roleDtos: RoleDto[] = []) => {
			roleService.findByNames.mockResolvedValue(roleDtos);

			const userDo = userDoFactory.build();
			userService.findById.mockResolvedValue(userDo);
			userService.findByIds.mockResolvedValue([userDo]);

			const group = groupFactory.build();
			groupRepo.findGroupById.mockResolvedValue(group);

			return { group, userDo };
		};

		describe('when adding a user to a group', () => {
			it('should call group.addUser', async () => {
				const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
				const { group, userDo } = setup([roleDto]);
				jest.spyOn(group, 'addUser');

				await service.addUsersToGroup('groupId', [{ userId: userDo.id!, roleName: roleDto.name }]);

				expect(group.addUser).toHaveBeenCalledWith(expect.objectContaining({ userId: userDo.id, roleId: roleDto.id }));
			});

			it('should call groupRepo.save', async () => {
				const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
				const { group, userDo } = setup([roleDto]);

				await service.addUsersToGroup('groupId', [{ userId: userDo.id!, roleName: roleDto.name }]);

				expect(groupRepo.save).toHaveBeenCalledWith(group);
			});

			describe('when role does not exist', () => {
				it('should fail', async () => {
					const { userDo } = setup();

					const method = () => service.addUsersToGroup('groupId', [{ userId: userDo.id!, roleName: RoleName.STUDENT }]);

					await expect(method).rejects.toThrow();
				});
			});

			describe('when user does not exist', () => {
				it('should fail', async () => {
					const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
					setup([roleDto]);
					userService.findByIds.mockResolvedValue([]);

					const method = () =>
						service.addUsersToGroup('groupId', [{ userId: 'unknown-userid', roleName: roleDto.name }]);

					await expect(method).rejects.toThrow();
				});
			});
		});
	});

	describe('removeUsersFromGroup', () => {
		const setup = (roleDtos: RoleDto[] = []) => {
			roleService.findByNames.mockResolvedValue(roleDtos);

			const userDo = userDoFactory.buildWithId();
			userService.findById.mockResolvedValue(userDo);
			userService.findByIds.mockResolvedValue([userDo]);

			const group = groupFactory.build();
			groupRepo.findGroupById.mockResolvedValue(group);

			return { group, userDo };
		};

		describe('when removing a user from a group', () => {
			it('should call group.removeUser', async () => {
				const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
				const { group, userDo } = setup([roleDto]);
				jest.spyOn(group, 'removeUser');
				const userId = userDo.id ?? '';

				await service.removeUsersFromGroup('groupId', [userId]);

				expect(group.removeUser).toHaveBeenCalledWith(expect.objectContaining({ id: userDo.id }));
			});

			it('should call groupRepo.save', async () => {
				const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
				const { group, userDo } = setup([roleDto]);
				const userId = userDo.id ?? '';

				await service.removeUsersFromGroup('groupId', [userId]);

				expect(groupRepo.save).toHaveBeenCalledWith(group);
			});

			describe('when user does not exist', () => {
				it('should fail', async () => {
					const roleDto = roleDtoFactory.buildWithId({ name: RoleName.STUDENT });
					setup([roleDto]);
					userService.findByIds.mockResolvedValue([]);

					const method = () => service.removeUsersFromGroup('groupId', ['unknown-userid']);

					await expect(method).rejects.toThrow();
				});
			});
		});
	});
});
