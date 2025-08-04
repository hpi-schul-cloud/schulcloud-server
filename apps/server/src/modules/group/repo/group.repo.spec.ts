import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { SystemEntity } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource, Page } from '@shared/domain/domainobject';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Group, GroupAggregateScope, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityTypes, GroupUserEmbeddable } from '../entity';
import { groupEntityFactory, groupFactory } from '../testing';
import { GroupRepo } from './group.repo';
import { Role } from '@modules/role/repo';

describe(GroupRepo.name, () => {
	let module: TestingModule;
	let repo: GroupRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [GroupEntity, SchoolEntity, User, SystemEntity, CourseEntity, CourseGroupEntity],
				}),
			],
			providers: [GroupRepo],
		}).compile();

		repo = module.get(GroupRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		describe('when an entity with the id exists', () => {
			const setup = async () => {
				const group: GroupEntity = groupEntityFactory.buildWithId();

				await em.persistAndFlush(group);
				em.clear();

				return {
					group,
				};
			};

			it('should return the group', async () => {
				const { group } = await setup();

				const result: Group | null = await repo.findGroupById(group.id);

				expect(result?.getProps()).toEqual<GroupProps>({
					id: group.id,
					name: group.name,
					type: GroupTypes.CLASS,
					externalSource: new ExternalSource({
						externalId: group.externalSource?.externalId ?? '',
						systemId: group.externalSource?.system.id ?? '',
						lastSyncedAt: group.externalSource?.lastSyncedAt ?? new Date(2024, 1, 1),
					}),
					users: [
						new GroupUser({
							userId: group.users[0].user.id,
							roleId: group.users[0].role.id,
						}),
						new GroupUser({
							userId: group.users[1].user.id,
							roleId: group.users[1].role.id,
						}),
						new GroupUser({
							userId: group.users[2].user.id,
							roleId: group.users[2].role.id,
						}),
					],
					organizationId: group.organization?.id,
					validPeriod: group.validPeriod,
				});
			});
		});

		describe('when no entity with the id exists', () => {
			it('should return null', async () => {
				const result: Group | null = await repo.findGroupById(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('findGroups', () => {
		describe('when the user has groups', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const userId: EntityId = userEntity.id;
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(4, {
					users: [{ user: userEntity, role: roleFactory.buildWithId() }],
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;
				groups[3].type = GroupEntityTypes.ROOM;

				const nameQuery = groups[2].name.slice(-3);

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...groups, ...otherGroups]);
				em.clear();

				return {
					userId,
					groups,
					nameQuery,
				};
			};

			it('should return the groups', async () => {
				const { userId, groups } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId });

				expect(result.data.map((group) => group.id).sort((a, b) => a.localeCompare(b))).toEqual(
					groups.map((group) => group.id).sort((a, b) => a.localeCompare(b))
				);
			});

			it('should return groups according to pagination', async () => {
				const { userId, groups } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId }, { pagination: { skip: 1, limit: 1 } });

				expect(result.total).toEqual(groups.length);
				expect(result.data.length).toEqual(1);
				// FIXME expect(result.data[0].id).toEqual(groups[1].id); MikroORM sorting does not work correctly (e.g. [10, 7, 8, 9])
			});

			it('should return groups according to name query', async () => {
				const { userId, groups, nameQuery } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId, nameQuery });

				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[2].id);
			});

			it('should return only groups of the given group types', async () => {
				const { userId } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId, groupTypes: [GroupTypes.ROOM] });

				expect(result.data).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.ROOM })]);
			});
		});

		describe('when the user has no groups', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const userId: EntityId = userEntity.id;

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...otherGroups]);
				em.clear();

				return {
					userId,
				};
			};

			it('should return an empty array', async () => {
				const { userId } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId });

				expect(result.data).toHaveLength(0);
			});
		});

		describe('when groups for the school exist', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;

				const nameQuery = groups[1].name.slice(-3);

				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const otherSchoolId: EntityId = otherSchool.id;
				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2, {
					type: GroupEntityTypes.CLASS,
					organization: otherSchool,
				});

				await em.persistAndFlush([school, ...groups, otherSchool, ...otherGroups]);
				em.clear();

				return {
					otherSchoolId,
					groups,
					nameQuery,
					schoolId,
				};
			};

			it('should return the groups', async () => {
				const { schoolId, groups } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId });

				expect(result.data).toHaveLength(groups.length);
			});

			it('should not return groups from another school', async () => {
				const { schoolId, otherSchoolId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId });

				expect(result.data.map((group) => group.organizationId)).not.toContain(otherSchoolId);
			});

			it('should return groups according to pagination', async () => {
				const { schoolId, groups } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId }, { pagination: { skip: 1, limit: 1 } });

				expect(result.total).toEqual(groups.length);
				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[1].id);
			});

			it('should return groups according to name query', async () => {
				const { schoolId, groups, nameQuery } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, nameQuery });

				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[1].id);
			});

			it('should return only groups of the given group types', async () => {
				const { schoolId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, groupTypes: [GroupTypes.CLASS] });

				expect(result.data).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;

				await em.persistAndFlush(school);
				em.clear();

				return {
					schoolId,
				};
			};

			it('should return an empty array', async () => {
				const { schoolId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId });

				expect(result.data).toHaveLength(0);
			});
		});

		describe('when groups for the school and system exist', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const systemId: EntityId = system.id;
				const school: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [system] });
				const schoolId: EntityId = school.id;
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
					externalSource: {
						system,
					},
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;

				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [system] });
				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2, {
					type: GroupEntityTypes.CLASS,
					organization: otherSchool,
				});

				await em.persistAndFlush([school, system, ...groups, otherSchool, ...otherGroups]);
				em.clear();

				return {
					schoolId,
					systemId,
					groups,
				};
			};

			it('should return the groups', async () => {
				const { schoolId, systemId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, systemId });

				expect(result.total).toEqual(3);
			});

			it('should only return groups from the selected school', async () => {
				const { schoolId, systemId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, systemId });

				expect(result.data.every((group) => group.organizationId === schoolId)).toEqual(true);
			});

			it('should only return groups from the selected system', async () => {
				const { schoolId, systemId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, systemId });

				expect(result.data.every((group) => group.externalSource?.systemId === systemId)).toEqual(true);
			});

			it('should return only groups of the given group type', async () => {
				const { schoolId, systemId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, systemId, groupTypes: [GroupTypes.CLASS] });

				expect(result.data).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const systemId: EntityId = system.id;

				await em.persistAndFlush([school, system]);
				em.clear();

				return {
					schoolId,
					systemId,
				};
			};

			it('should return an empty array', async () => {
				const { schoolId, systemId } = await setup();

				const result: Page<Group> = await repo.findGroups({ schoolId, systemId });

				expect(result.data).toHaveLength(0);
			});
		});
	});

	describe('findByUsersSchoolId', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ school });
			const role = roleFactory.buildWithId({ name: RoleName.TEACHER });

			await em.persistAndFlush([user, school]);
			em.clear();

			return {
				user,
				school,
				role,
			};
		};

		const addGroup = async (
			school: SchoolEntity,
			role: Role,
			internalUsers = 0,
			externalUsers = 0
		): Promise<GroupEntity> => {
			const internalUsersArray: User[] = userFactory.buildListWithId(internalUsers, { school });
			const externalUsersArray: User[] = userFactory.buildListWithId(externalUsers);

			const users: GroupUserEmbeddable[] = [...internalUsersArray, ...externalUsersArray].map((user) => {
				return {
					user,
					role,
				};
			});
			const group = groupEntityFactory.withTypeRoom().buildWithId({ organization: school, users });
			await em.persistAndFlush([...internalUsersArray, ...externalUsersArray, role, group]);
			em.clear();

			return group;
		};

		describe('when users from the same school are in one group', () => {
			it('should return the group', async () => {
				const { school, role } = await setup();
				const group = await addGroup(school, role, 4, 0);

				const result: Page<Group> = await repo.findByUsersSchoolId(school.id, [GroupTypes.ROOM]);

				expect(result.data).toHaveLength(1);
				expect(result.data[0].id).toEqual(group.id);
				expect(result.total).toEqual(1);
			});
		});

		describe('when users from the same school are in multiple groups', () => {
			it('should return these groups', async () => {
				const { school, role } = await setup();
				const group1 = await addGroup(school, role, 4, 0);
				const group2 = await addGroup(school, role, 6, 0);

				const result: Page<Group> = await repo.findByUsersSchoolId(school.id, [GroupTypes.ROOM]);

				expect(result.data).toHaveLength(2);
				expect(result.data.map((g) => g.id)).toEqual([group1.id, group2.id].sort());
				expect(result.total).toEqual(2);
			});
		});

		describe('when users from the same school are in none of the existing groups', () => {
			it('should return an empty array', async () => {
				const { school, role } = await setup();
				await addGroup(school, role, 0, 4);
				await addGroup(school, role, 0, 6);

				const result: Page<Group> = await repo.findByUsersSchoolId(school.id, [GroupTypes.ROOM]);

				expect(result.data).toHaveLength(0);
				expect(result.total).toEqual(0);
			});
		});
	});

	describe('findGroupsForScope', () => {
		describe('when using pagination and sorting', () => {
			const setup = async () => {
				const groups = groupEntityFactory.buildListWithId(4);

				const scope = new GroupAggregateScope({
					pagination: { skip: 1, limit: 2 },
					order: { name: SortOrder.desc },
				});

				await em.persistAndFlush([...groups]);
				em.clear();

				return {
					scope,
					groups,
				};
			};

			it('should return the correct groups', async () => {
				const { groups, scope } = await setup();

				const result: Page<Group> = await repo.findGroupsForScope(scope);

				expect(result.total).toEqual(groups.length);
				expect(result.data).toHaveLength(2);
				expect(result.data[0].id).toEqual(groups[2].id);
				expect(result.data[1].id).toEqual(groups[1].id);
			});
		});

		describe('when searching by name', () => {
			const setup = async () => {
				const groups = groupEntityFactory.buildListWithId(3);

				const scope = new GroupAggregateScope().byName(groups[1].name);

				await em.persistAndFlush([...groups]);
				em.clear();

				return {
					scope,
					groups,
				};
			};

			it('should return the groups with the selected name', async () => {
				const { groups, scope } = await setup();

				const result: Page<Group> = await repo.findGroupsForScope(scope);

				expect(result.total).toEqual(1);
				expect(result.data).toHaveLength(1);
				expect(result.data[0].id).toEqual(groups[1].id);
			});
		});

		describe('when searching by organization', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const group = groupEntityFactory.buildWithId({ organization: school });
				const otherGroup = groupEntityFactory.buildWithId({ organization: schoolEntityFactory.buildWithId() });

				const scope = new GroupAggregateScope().byOrganization(school.id);

				await em.persistAndFlush([group, otherGroup, school]);
				em.clear();

				return {
					scope,
					group,
					otherGroup,
				};
			};

			it('should return the groups with the selected school', async () => {
				const { group, scope } = await setup();

				const result: Page<Group> = await repo.findGroupsForScope(scope);

				expect(result.total).toEqual(1);
				expect(result.data).toHaveLength(1);
				expect(result.data[0].id).toEqual(group.id);
			});
		});

		describe('when searching by user', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const group = groupEntityFactory.buildWithId({
					users: [
						new GroupUserEmbeddable({
							user,
							role: roleFactory.buildWithId({ name: RoleName.STUDENT }),
						}),
					],
				});
				const otherGroup = groupEntityFactory.buildWithId();

				const scope = new GroupAggregateScope().byUser(user.id);

				await em.persistAndFlush([group, otherGroup, user]);
				em.clear();

				return {
					scope,
					group,
				};
			};

			it('should return the groups with the selected user', async () => {
				const { group, scope } = await setup();

				const result: Page<Group> = await repo.findGroupsForScope(scope);

				expect(result.total).toEqual(1);
				expect(result.data).toHaveLength(1);
				expect(result.data[0].id).toEqual(group.id);
			});
		});

		describe('when searching for available groups for a course synchronization', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const availableCourseGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.COURSE,
					users: [
						new GroupUserEmbeddable({
							user,
							role: roleFactory.buildWithId({ name: RoleName.STUDENT }),
						}),
					],
					organization: school,
				});
				const synchronizedCourseGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.COURSE,
					users: [
						new GroupUserEmbeddable({
							user,
							role: roleFactory.buildWithId({ name: RoleName.STUDENT }),
						}),
					],
					organization: school,
				});
				const courseSynchronizedWithCourseGroup = courseEntityFactory.buildWithId({
					syncedWithGroup: synchronizedCourseGroup,
				});

				const synchronizedClassGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.CLASS,
					users: [
						new GroupUserEmbeddable({
							user,
							role: roleFactory.buildWithId({ name: RoleName.STUDENT }),
						}),
					],
					organization: school,
				});
				const courseSynchronizedWithClassGroup = courseEntityFactory.buildWithId({
					syncedWithGroup: synchronizedClassGroup,
				});

				const scope = new GroupAggregateScope().byAvailableForSync(true);

				await em.persistAndFlush([
					availableCourseGroup,
					synchronizedCourseGroup,
					courseSynchronizedWithCourseGroup,
					synchronizedClassGroup,
					courseSynchronizedWithClassGroup,
				]);
				em.clear();

				return {
					scope,
					availableCourseGroup,
					synchronizedClassGroup,
				};
			};

			it('should return the groups that are available', async () => {
				const { availableCourseGroup, synchronizedClassGroup, scope } = await setup();

				const result: Page<Group> = await repo.findGroupsForScope(scope);

				expect(result.total).toEqual(2);
				expect(result.data).toHaveLength(2);
				expect(result.data[0].id).toEqual(availableCourseGroup.id);
				expect(result.data[1].id).toEqual(synchronizedClassGroup.id);
			});
		});

		describe('when no group exists', () => {
			it('should return an empty array', async () => {
				const result: Page<Group> = await repo.findGroupsForScope(new GroupAggregateScope());

				expect(result.total).toEqual(0);
			});
		});
	});

	describe('save', () => {
		describe('when a new object is provided', () => {
			const setup = () => {
				const groupId = new ObjectId().toHexString();

				const group: Group = groupFactory.build({ id: groupId });

				return {
					group,
					groupId,
				};
			};

			it('should create a new entity', async () => {
				const { group, groupId } = setup();

				await repo.save(group);

				await expect(em.findOneOrFail(GroupEntity, groupId)).resolves.toBeDefined();
			});

			it('should return the object', async () => {
				const { group } = setup();

				const result: Group = await repo.save(group);

				expect(result).toEqual(group);
			});
		});

		describe('when an entity with the id exists', () => {
			const setup = async () => {
				const groupId = new ObjectId().toHexString();
				const groupEntity: GroupEntity = groupEntityFactory.buildWithId({ name: 'Initial Name' }, groupId);

				await em.persistAndFlush(groupEntity);
				em.clear();

				const newName = 'New Name';
				const group: Group = groupFactory.build({ id: groupId, name: newName });

				return {
					groupEntity,
					group,
					groupId,
					newName,
				};
			};

			it('should update the entity', async () => {
				const { group, groupId, newName } = await setup();

				await repo.save(group);

				await expect(em.findOneOrFail(GroupEntity, groupId)).resolves.toEqual(
					expect.objectContaining({ name: newName })
				);
			});

			it('should return the object', async () => {
				const { group } = await setup();

				const result: Group = await repo.save(group);

				expect(result).toEqual(group);
			});
		});
	});

	describe('delete', () => {
		describe('when an entity exists', () => {
			const setup = async () => {
				const groupId = new ObjectId().toHexString();
				const groupEntity: GroupEntity = groupEntityFactory.buildWithId(undefined, groupId);

				await em.persistAndFlush(groupEntity);
				em.clear();

				const group: Group = groupFactory.build({ id: groupId });

				return {
					group,
					groupId,
				};
			};

			it('should delete the entity', async () => {
				const { group, groupId } = await setup();

				await repo.delete(group);

				expect(await em.findOne(GroupEntity, groupId)).toBeNull();
			});
		});
	});

	describe('findByExternalSource', () => {
		describe('when an entity with the external source exists', () => {
			const setup = async () => {
				const groupEntity: GroupEntity = groupEntityFactory.buildWithId();

				await em.persistAndFlush(groupEntity);
				em.clear();

				return {
					groupEntity,
				};
			};

			it('should return the group', async () => {
				const { groupEntity } = await setup();

				const result: Group | null = await repo.findByExternalSource(
					groupEntity.externalSource?.externalId ?? '',
					groupEntity.externalSource?.system.id ?? ''
				);

				expect(result?.getProps()).toEqual<GroupProps>({
					id: groupEntity.id,
					name: groupEntity.name,
					type: GroupTypes.CLASS,
					externalSource: new ExternalSource({
						externalId: groupEntity.externalSource?.externalId ?? '',
						systemId: groupEntity.externalSource?.system.id ?? '',
						lastSyncedAt: groupEntity.externalSource?.lastSyncedAt ?? new Date(2024, 1, 1),
					}),
					users: [
						new GroupUser({
							userId: groupEntity.users[0].user.id,
							roleId: groupEntity.users[0].role.id,
						}),
						new GroupUser({
							userId: groupEntity.users[1].user.id,
							roleId: groupEntity.users[1].role.id,
						}),
						new GroupUser({
							userId: groupEntity.users[2].user.id,
							roleId: groupEntity.users[2].role.id,
						}),
					],
					organizationId: groupEntity.organization?.id,
					validPeriod: groupEntity.validPeriod,
				});
			});
		});

		describe('when no entity with the external source exists', () => {
			it('should return null', async () => {
				const result: Group | null = await repo.findByExternalSource(
					new ObjectId().toHexString(),
					new ObjectId().toHexString()
				);

				expect(result).toBeNull();
			});
		});
	});

	describe('removeUserReference', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const otherUser = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOMOWNER });
			const group = groupEntityFactory.buildWithId({
				users: [
					new GroupUserEmbeddable({
						user,
						role,
					}),
					new GroupUserEmbeddable({
						user: otherUser,
						role,
					}),
				],
			});

			await em.persistAndFlush([user, otherUser, role, group]);
			em.clear();

			return {
				userId: user.id,
				otherUserId: otherUser.id,
				group,
			};
		};

		it('should actually remove the user reference from the group', async () => {
			const { userId, otherUserId, group } = await setup();

			await repo.removeUserReference(userId);

			const updatedGroup = await em.findOne(GroupEntity, group.id);
			expect(updatedGroup?.users).toHaveLength(1);
			expect(updatedGroup?.users[0].user.id).toEqual(otherUserId);
		});

		it('should return count of 1 group updated', async () => {
			const { userId } = await setup();

			const numberOfUpdatedGroups = await repo.removeUserReference(userId);

			expect(numberOfUpdatedGroups).toEqual(1);
		});

		it('should not affect other users having the same group', async () => {
			const { userId, otherUserId, group } = await setup();

			await repo.removeUserReference(userId);

			const updatedGroup = await em.findOne(GroupEntity, group.id);
			expect(updatedGroup?.users).toHaveLength(1);
			expect(updatedGroup?.users[0].user.id).toEqual(otherUserId);
		});
	});
});
