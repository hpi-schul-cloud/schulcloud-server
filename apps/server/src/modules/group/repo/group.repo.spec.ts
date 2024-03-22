import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource, UserDO } from '@shared/domain/domainobject';
import { Course as CourseEntity, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import {
	cleanupCollections,
	courseFactory,
	groupEntityFactory,
	groupFactory,
	roleFactory,
	schoolEntityFactory,
	systemEntityFactory,
	userDoFactory,
	userFactory,
} from '@shared/testing';
import { Group, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityTypes, GroupUserEntity } from '../entity';
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

	describe('findByUserAndGroupTypes', () => {
		describe('when the user has groups', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const user: UserDO = userDoFactory.build({ id: userEntity.id });
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					users: [{ user: userEntity, role: roleFactory.buildWithId() }],
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...groups, ...otherGroups]);
				em.clear();

				return {
					user,
					groups,
				};
			};

			it('should return the groups', async () => {
				const { user, groups } = await setup();

				const result: Group[] = await repo.findByUserAndGroupTypes(user, [
					GroupTypes.CLASS,
					GroupTypes.COURSE,
					GroupTypes.OTHER,
				]);

				expect(result.map((group) => group.id).sort((a, b) => a.localeCompare(b))).toEqual(
					groups.map((group) => group.id).sort((a, b) => a.localeCompare(b))
				);
			});

			it('should return groups according to pagination', async () => {
				const { user, groups } = await setup();

				const result: Group[] = await repo.findByUserAndGroupTypes(
					user,
					[GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					1,
					1
				);

				expect(result.length).toEqual(1);
				expect(result[0].id).toEqual(groups[1].id);
			});

			it('should return only groups of the given group types', async () => {
				const { user } = await setup();

				const result: Group[] = await repo.findByUserAndGroupTypes(user, [GroupTypes.CLASS]);

				expect(result).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
			});

			describe('when no group type is given', () => {
				it('should return all groups', async () => {
					const { user, groups } = await setup();

					const result: Group[] = await repo.findByUserAndGroupTypes(user);

					expect(result.map((group) => group.id).sort((a, b) => a.localeCompare(b))).toEqual(
						groups.map((group) => group.id).sort((a, b) => a.localeCompare(b))
					);
				});
			});
		});

		describe('when the user has no groups exists', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const user: UserDO = userDoFactory.build({ id: userEntity.id });

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...otherGroups]);
				em.clear();

				return {
					user,
				};
			};

			it('should return an empty array', async () => {
				const { user } = await setup();

				const result: Group[] = await repo.findByUserAndGroupTypes(user, [
					GroupTypes.CLASS,
					GroupTypes.COURSE,
					GroupTypes.OTHER,
				]);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findAvailableByUser', () => {
		describe('when the user has groups', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const user: UserDO = userDoFactory.build({ id: userEntity.id });
				const groupUserEntity: GroupUserEntity = { user: userEntity, role: roleFactory.buildWithId() };
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					users: [groupUserEntity],
				});
				const course: CourseEntity = courseFactory.build({ syncedWithGroup: groups[0] });

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...groups, ...otherGroups, course]);
				em.clear();

				return {
					user,
					groups,
				};
			};

			it('should return the available groups', async () => {
				const { user } = await setup();

				const result: Group[] = await repo.findAvailableByUser(user);

				expect(result).toHaveLength(2);
				expect(result.every((group) => group.users[0].userId === user.id)).toEqual(true);
			});

			it('should return groups according to pagination', async () => {
				const { user, groups } = await setup();

				const result: Group[] = await repo.findAvailableByUser(user, 1, 1);

				expect(result.length).toEqual(1);
				expect(result[0].id).toEqual(groups[2].id);
			});
		});

		describe('when the user has no groups exists', () => {
			const setup = async () => {
				const userEntity: User = userFactory.buildWithId();
				const user: UserDO = userDoFactory.build({ id: userEntity.id });

				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2);

				await em.persistAndFlush([userEntity, ...otherGroups]);
				em.clear();

				return {
					user,
				};
			};

			it('should return an empty array', async () => {
				const { user } = await setup();

				const result: Group[] = await repo.findAvailableByUser(user);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findBySchoolIdAndGroupTypes', () => {
		describe('when groups for the school exist', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
				});
				groups[1].type = GroupEntityTypes.COURSE;
				groups[2].type = GroupEntityTypes.OTHER;

				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2, {
					type: GroupEntityTypes.CLASS,
					organization: otherSchool,
				});

				await em.persistAndFlush([school, ...groups, otherSchool, ...otherGroups]);
				em.clear();

				return {
					school,
					otherSchool,
					groups,
				};
			};

			it('should return the groups', async () => {
				const { school, groups } = await setup();

				const result: Group[] = await repo.findBySchoolIdAndGroupTypes(school.id, [
					GroupTypes.CLASS,
					GroupTypes.COURSE,
					GroupTypes.OTHER,
				]);

				expect(result).toHaveLength(groups.length);
			});

			it('should not return groups from another school', async () => {
				const { school, otherSchool } = await setup();

				const result: Group[] = await repo.findBySchoolIdAndGroupTypes(school.id, [
					GroupTypes.CLASS,
					GroupTypes.COURSE,
				]);

				expect(result.map((group) => group.organizationId)).not.toContain(otherSchool.id);
			});

			it('should return groups according to pagination', async () => {
				const { school, groups } = await setup();

				const result: Group[] = await repo.findBySchoolIdAndGroupTypes(
					school.id,
					[GroupTypes.CLASS, GroupTypes.COURSE, GroupTypes.OTHER],
					1,
					1
				);

				expect(result.length).toEqual(1);
				expect(result[0].id).toEqual(groups[1].id);
			});

			it('should return only groups of the given group types', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findBySchoolIdAndGroupTypes(school.id, [GroupTypes.CLASS]);

				expect(result).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
			});

			describe('when no group type is given', () => {
				it('should return all groups', async () => {
					const { school, groups } = await setup();

					const result: Group[] = await repo.findBySchoolIdAndGroupTypes(school.id);

					expect(result).toHaveLength(groups.length);
				});
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

				await em.persistAndFlush(school);
				em.clear();

				return {
					school,
				};
			};

			it('should return an empty array', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findBySchoolIdAndGroupTypes(school.id, [GroupTypes.CLASS]);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findAvailableBySchoolId', () => {
		describe('when available groups for the school exist', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
				});
				const course: CourseEntity = courseFactory.build({ school, syncedWithGroup: groups[0] });

				const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const otherGroups: GroupEntity[] = groupEntityFactory.buildListWithId(2, {
					type: GroupEntityTypes.CLASS,
					organization: otherSchool,
				});

				await em.persistAndFlush([school, ...groups, otherSchool, ...otherGroups, course]);
				em.clear();

				return {
					school,
					otherSchool,
					groups,
				};
			};

			it('should return the available groups from selected school', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findAvailableBySchoolId(school.id);

				expect(result).toHaveLength(2);
				expect(result.every((group) => group.organizationId === school.id)).toEqual(true);
			});

			it('should return groups according to pagination', async () => {
				const { school, groups } = await setup();

				const result: Group[] = await repo.findAvailableBySchoolId(school.id, 1, 1);

				expect(result.length).toEqual(1);
				expect(result[0].id).toEqual(groups[2].id);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

				await em.persistAndFlush([school]);
				em.clear();

				return {
					school,
				};
			};

			it('should return an empty array', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findAvailableBySchoolId(school.id);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findGroupsBySchoolIdAndSystemIdAndGroupType', () => {
		describe('when groups for the school exist', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [system] });
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
					school,
					system,
					otherSchool,
					groups,
				};
			};

			it('should return the groups', async () => {
				const { school, system } = await setup();

				const result: Group[] = await repo.findGroupsBySchoolIdAndSystemIdAndGroupType(
					school.id,
					system.id,
					GroupTypes.CLASS
				);

				expect(result).toHaveLength(1);
			});

			it('should only return groups from the selected school', async () => {
				const { school, system } = await setup();

				const result: Group[] = await repo.findGroupsBySchoolIdAndSystemIdAndGroupType(
					school.id,
					system.id,
					GroupTypes.CLASS
				);

				expect(result.every((group) => group.organizationId === school.id)).toEqual(true);
			});

			it('should only return groups from the selected system', async () => {
				const { school, system } = await setup();

				const result: Group[] = await repo.findGroupsBySchoolIdAndSystemIdAndGroupType(
					school.id,
					system.id,
					GroupTypes.CLASS
				);

				expect(result.every((group) => group.externalSource?.systemId === system.id)).toEqual(true);
			});

			it('should return only groups of the given group type', async () => {
				const { school, system } = await setup();

				const result: Group[] = await repo.findGroupsBySchoolIdAndSystemIdAndGroupType(
					school.id,
					system.id,
					GroupTypes.CLASS
				);

				expect(result).toEqual([expect.objectContaining<Partial<Group>>({ type: GroupTypes.CLASS })]);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const system: SystemEntity = systemEntityFactory.buildWithId();

				await em.persistAndFlush([school, system]);
				em.clear();

				return {
					school,
					system,
				};
			};

			it('should return an empty array', async () => {
				const { school, system } = await setup();

				const result: Group[] = await repo.findGroupsBySchoolIdAndSystemIdAndGroupType(
					school.id,
					system.id,
					GroupTypes.CLASS
				);

				expect(result).toHaveLength(0);
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
