import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { Group, GroupAggregateScope, GroupDeletedEvent, GroupTypes, GroupVisibilityPermission } from '../domain';
import { GROUP_CONFIG_TOKEN, GroupConfig } from '../group.config';
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
	let config: GroupConfig;

	beforeAll(async () => {
		await setupEntities([User]);

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
					provide: GROUP_CONFIG_TOKEN,
					useValue: {
						featureSchulconnexCourseSyncEnabled: true,
					},
				},
			],
		}).compile();

		service = module.get(GroupService);
		roleService = module.get(RoleService);
		userService = module.get(UserService);
		groupRepo = module.get(GroupRepo);
		eventBus = module.get(EventBus);
		config = module.get(GROUP_CONFIG_TOKEN);
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

	describe('findByUsersAndRoomsSchoolId', () => {
		const setup = () => {
			const schoolId: EntityId = new ObjectId().toHexString();
			const types: GroupTypes[] = [GroupTypes.CLASS, GroupTypes.COURSE];
			const groups: Group[] = groupFactory.buildList(2);
			const page: Page<Group> = new Page<Group>(groups, groups.length);

			groupRepo.findByUsersAndRoomsSchoolId.mockResolvedValue(page);

			return {
				schoolId,
				types,
				groups,
			};
		};

		it('should call the repo with the school id and types', async () => {
			const { schoolId, types } = setup();

			await service.findByUsersAndRoomsSchoolId(schoolId, types);

			expect(groupRepo.findByUsersAndRoomsSchoolId).toHaveBeenCalledWith(schoolId, types);
		});
	});

	describe('findByScope', () => {
		describe('when the school has groups', () => {
			const setup = () => {
				const scope = new GroupAggregateScope();
				const groups: Group[] = groupFactory.buildList(2);
				const page: Page<Group> = new Page<Group>(groups, groups.length);

				groupRepo.findGroupsForScope.mockResolvedValueOnce(page);

				return {
					page,
					scope,
				};
			};

			it('should call the repo', async () => {
				const { scope } = setup();

				await service.findByScope(scope);

				expect(groupRepo.findGroupsForScope).toHaveBeenCalledWith(scope);
			});

			it('should return the groups', async () => {
				const { scope, page } = setup();

				const result = await service.findByScope(scope);

				expect(result).toEqual(page);
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

				config.featureSchulconnexCourseSyncEnabled = true;
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

				config.featureSchulconnexCourseSyncEnabled = false;
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

				expect(group.removeUser).toHaveBeenCalledWith(userDo.id);
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

	describe('removeUserReference', () => {
		const setup = () => {
			const userId: EntityId = new ObjectId().toHexString();
			const numberOfUpdatedGroups = 3;
			groupRepo.removeUserReference.mockResolvedValue(numberOfUpdatedGroups);

			return {
				userId,
				numberOfUpdatedGroups,
			};
		};

		it('should call groupRepo.removeUserReference with userId', async () => {
			const { userId } = setup();

			await service.removeUserReference(userId);

			expect(groupRepo.removeUserReference).toHaveBeenCalledWith(userId);
		});

		it('should return the number of updated groups', async () => {
			const { userId, numberOfUpdatedGroups } = setup();

			const result: number = await service.removeUserReference(userId);

			expect(result).toEqual(numberOfUpdatedGroups);
		});
	});

	describe('findAllGroupsForUser', () => {
		const setup = () => {
			const userId: EntityId = new ObjectId().toHexString();
			const groups: Group[] = groupFactory.buildList(2);

			groupRepo.findGroupsByFilter.mockResolvedValue({ domainObjects: groups, total: groups.length });

			return {
				userId,
				groups,
			};
		};

		it('should call groupRepo.findGroupsByFilter with userId', async () => {
			const { userId } = setup();

			await service.findAllGroupsForUser(userId);

			expect(groupRepo.findGroupsByFilter).toHaveBeenCalledWith({ userId });
		});

		it('should return the groups for the user', async () => {
			const { userId, groups } = setup();

			const result: Group[] = await service.findAllGroupsForUser(userId);

			expect(result).toEqual(groups);
		});
	});

	describe('findExistingGroupsByIds', () => {
		describe('when groups with these ids exist', () => {
			const setup = () => {
				const [groupOne, groupTwo]: Group[] = groupFactory.buildList(2);

				groupRepo.findGroupById.mockResolvedValueOnce(groupOne);
				groupRepo.findGroupById.mockResolvedValueOnce(groupTwo);

				return {
					groupOne,
					groupTwo,
				};
			};

			it('should return the groups as array', async () => {
				const { groupOne, groupTwo } = setup();

				const result: Group[] = await service.findExistingGroupsByIds([groupOne.id, groupTwo.id]);

				expect(result).toEqual([groupOne, groupTwo]);
			});
		});

		describe('when a group with the id does not exist', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should return empty array', async () => {
				const { group } = setup();

				const result = await service.findExistingGroupsByIds([group.id]);

				expect(result).toEqual([]);
			});
		});
	});

	describe('getGroupName', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(group);

				return {
					group,
				};
			};

			it('should return the group name', async () => {
				const { group } = setup();

				const result: string | undefined = await service.getGroupName(group.id);

				expect(result).toEqual(group.name);
			});
		});

		describe('when a group with the id does not exist', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				groupRepo.findGroupById.mockResolvedValue(null);

				return {
					group,
				};
			};

			it('should return undefined', async () => {
				const { group } = setup();

				const result: string | undefined = await service.getGroupName(group.id);

				expect(result).toBeUndefined();
			});
		});
	});
});
