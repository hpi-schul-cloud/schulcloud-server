import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { type SystemEntity } from '@modules/system/entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource, Page } from '@shared/domain/domainobject';
import { Course as CourseEntity, SchoolEntity, User } from '@shared/domain/entity';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	cleanupCollections,
	courseFactory,
	groupEntityFactory,
	groupFactory,
	roleFactory,
	schoolEntityFactory,
	systemEntityFactory,
	userFactory,
} from '@shared/testing';
import { Group, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityTypes, GroupUserEmbeddable } from '../entity';
import { GroupRepo } from './group.repo';

describe('GroupRepo', () => {
	let module: TestingModule;
	let repo: GroupRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
					],
					organizationId: group.organization?.id,
					validFrom: group.validPeriod?.from,
					validUntil: group.validPeriod?.until,
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
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					users: [{ user: userEntity, role: roleFactory.buildWithId() }],
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;

				const nameQuery = groups[1].name.slice(-3);

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
				expect(result.data[0].id).toEqual(groups[1].id);
			});

			it('should return groups according to name query', async () => {
				const { userId, groups, nameQuery } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId, nameQuery });

				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[1].id);
			});

			it('should return only groups of the given group types', async () => {
				const { userId } = await setup();

				const result: Page<Group> = await repo.findGroups({ userId, groupTypes: [GroupTypes.CLASS] });

				expect(result.data).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
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

	describe('findAvailableGroups', () => {
		describe('when the user has groups', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const userId: EntityId = userEntity.id;
				const groupUserEntity: GroupUserEmbeddable = new GroupUserEmbeddable({
					user: userEntity,
					role: roleFactory.buildWithId(),
				});
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					users: [groupUserEntity],
				});
				const nameQuery = groups[2].name.slice(-3);
				const course: CourseEntity = courseFactory.build({ syncedWithGroup: groups[0] });
				const availableGroupsCount = 2;

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...groups, ...otherGroups, course]);
				em.clear();

				const defaultOptions: IFindOptions<Group> = { pagination: { skip: 0 } };

				return {
					userId,
					groups,
					availableGroupsCount,
					nameQuery,
					defaultOptions,
				};
			};

			it('should return the available groups', async () => {
				const { userId, availableGroupsCount, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ userId }, defaultOptions);

				expect(result.total).toEqual(availableGroupsCount);
				expect(result.data.every((group) => group.users[0].userId === userId)).toEqual(true);
			});

			it('should return groups according to pagination', async () => {
				const { userId, groups, availableGroupsCount } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ userId }, { pagination: { skip: 1, limit: 1 } });

				expect(result.total).toEqual(availableGroupsCount);
				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[2].id);
			});

			it('should return groups according to name query', async () => {
				const { userId, groups, nameQuery, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ userId, nameQuery }, defaultOptions);

				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[2].id);
			});
		});

		describe('when the user has no groups exists', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const userId: EntityId = userEntity.id;

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...otherGroups]);
				em.clear();

				const defaultOptions: IFindOptions<Group> = { pagination: { skip: 0 } };

				return {
					userId,
					defaultOptions,
				};
			};

			it('should return an empty array', async () => {
				const { userId, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ userId }, defaultOptions);

				expect(result.total).toEqual(0);
			});
		});

		describe('when available groups for the school exist', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
				});
				const nameQuery = groups[2].name.slice(-3);
				const course: CourseEntity = courseFactory.build({ school, syncedWithGroup: groups[0] });
				const availableGroupsCount = 2;

				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2, {
					type: GroupEntityTypes.CLASS,
					organization: otherSchool,
				});

				await em.persistAndFlush([school, ...groups, otherSchool, ...otherGroups, course]);
				em.clear();

				const defaultOptions: IFindOptions<Group> = { pagination: { skip: 0 } };

				return {
					schoolId,
					groups,
					availableGroupsCount,
					nameQuery,
					defaultOptions,
				};
			};

			it('should return the available groups from selected school', async () => {
				const { schoolId, availableGroupsCount, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ schoolId }, defaultOptions);

				expect(result.data).toHaveLength(availableGroupsCount);
				expect(result.data.every((group) => group.organizationId === schoolId)).toEqual(true);
			});

			it('should return groups according to pagination', async () => {
				const { schoolId, groups, availableGroupsCount } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ schoolId }, { pagination: { skip: 1, limit: 1 } });

				expect(result.total).toEqual(availableGroupsCount);
				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[2].id);
			});

			it('should return groups according to name query', async () => {
				const { schoolId, groups, nameQuery, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ schoolId, nameQuery }, defaultOptions);

				expect(result.data.length).toEqual(1);
				expect(result.data[0].id).toEqual(groups[2].id);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;

				await em.persistAndFlush([school]);
				em.clear();

				const defaultOptions: IFindOptions<Group> = { pagination: { skip: 0 } };

				return {
					schoolId,
					defaultOptions,
				};
			};

			it('should return an empty array', async () => {
				const { schoolId, defaultOptions } = await setup();

				const result: Page<Group> = await repo.findAvailableGroups({ schoolId }, defaultOptions);

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
					],
					organizationId: groupEntity.organization?.id,
					validFrom: groupEntity.validPeriod?.from,
					validUntil: groupEntity.validPeriod?.until,
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
});
