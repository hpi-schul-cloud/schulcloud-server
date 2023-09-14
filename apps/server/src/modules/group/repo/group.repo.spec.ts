import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource, School } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, groupEntityFactory, groupFactory, schoolFactory } from '@shared/testing';
import { Group, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityTypes } from '../entity';
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

				const result: Group | null = await repo.findById(group.id);

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
				const result: Group | null = await repo.findById(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('findClassesForSchool', () => {
		describe('when groups of type class for the school exist', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();
				const groups: GroupEntity[] = groupEntityFactory.buildListWithId(3, {
					type: GroupEntityTypes.CLASS,
					organization: school,
				});

				const otherSchool: School = schoolFactory.buildWithId();
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

			it('should return the group', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findClassesForSchool(school.id);

				expect(result).toHaveLength(3);
			});

			it('should not return groups from another school', async () => {
				const { school, otherSchool } = await setup();

				const result: Group[] = await repo.findClassesForSchool(school.id);

				expect(result.map((group) => group.organizationId)).not.toContain(otherSchool.id);
			});
		});

		describe('when no group exists', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				await em.persistAndFlush(school);
				em.clear();

				return {
					school,
				};
			};

			it('should return an empty array', async () => {
				const { school } = await setup();

				const result: Group[] = await repo.findClassesForSchool(school.id);

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

			it('should return true', async () => {
				const { group } = await setup();

				const result: boolean = await repo.delete(group);

				expect(result).toEqual(true);
			});
		});

		describe('when no entity exists', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				return {
					group,
				};
			};

			it('should return false', async () => {
				const { group } = setup();

				const result: boolean = await repo.delete(group);

				expect(result).toEqual(false);
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
