import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { classEntityFactory } from '@modules/class/entity/testing/factory/class.entity.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { randomUUID } from 'crypto';
import { ClassEntity } from '../entity';
import { ClassScope } from './class.scope';
import { ClassesRepo } from './classes.repo';
import { ClassMapper } from './mapper';

describe(ClassesRepo.name, () => {
	let module: TestingModule;
	let repo: ClassesRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ClassEntity] })],
			providers: [ClassesRepo, ClassMapper],
		}).compile();

		repo = module.get(ClassesRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('find', () => {
		describe('when school has no class', () => {
			it('should return empty array', async () => {
				const result = await repo.find(new ClassScope().allowEmptyQuery(true));

				expect(result).toEqual([]);
			});
		});

		describe('when school has classes', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const classes = classEntityFactory.buildListWithId(3, { schoolId: school.id });

				await em.persistAndFlush(classes);
				em.clear();

				return {
					school,
				};
			};

			it('should find classes with particular schoolId', async () => {
				const { school } = await setup();

				const result = await repo.find(new ClassScope().bySchoolId(school.id));

				expect(result.length).toEqual(3);
			});
		});
	});

	describe('findAllBySchoolId', () => {
		describe('when school has no class', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllBySchoolId(new ObjectId().toHexString());

				expect(result).toEqual([]);
			});
		});

		describe('when school has classes', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const classes = classEntityFactory.buildListWithId(3, { schoolId: school.id });

				await em.persistAndFlush(classes);
				em.clear();

				return {
					school,
					classes,
				};
			};

			it('should find classes with particular schoolId', async () => {
				const { school } = await setup();

				const result = await repo.findAllBySchoolId(school.id);

				expect(result.length).toEqual(3);
			});
		});
	});

	describe('findAllByUserId', () => {
		describe('when user is not found in classes', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllByUserId(new ObjectId().toHexString());

				expect(result).toEqual([]);
			});
		});

		describe('when user is in classes', () => {
			const setup = async () => {
				const testUser = new ObjectId();
				const class1 = classEntityFactory.withUserIds([testUser, new ObjectId()]).buildWithId();
				const class2 = classEntityFactory.withUserIds([new ObjectId()]).buildWithId({ teacherIds: [testUser] });
				const class3 = classEntityFactory.withUserIds([new ObjectId(), new ObjectId()]).buildWithId();

				await em.persistAndFlush([class1, class2, class3]);
				em.clear();

				return {
					class1,
					class2,
					class3,
				};
			};

			it('should find classes with particular userId', async () => {
				const { class1, class2 } = await setup();

				const a = class1.userIds?.at(0) as ObjectId;
				const result = await repo.findAllByUserId(a.toHexString());

				expect(result.length).toEqual(2);

				expect(result[0].id).toEqual(class1.id);
				expect(result[1].id).toEqual(class2.id);
			});
		});
	});

	describe('removeUserReference', () => {
		describe('when deleting user data from classes', () => {
			const setup = async () => {
				const testUser1 = new ObjectId();
				const testUser2 = new ObjectId();
				const testUser3 = new ObjectId();
				const class1 = classEntityFactory.withUserIds([testUser1, testUser2]).buildWithId();
				const class2 = classEntityFactory.withUserIds([testUser1, testUser3]).buildWithId();
				const class3 = classEntityFactory.withUserIds([testUser2, testUser3]).buildWithId();

				await em.persistAndFlush([class1, class2, class3]);
				em.clear();

				return {
					class1,
					class2,
					testUser1,
					testUser2,
					testUser3,
				};
			};

			it('should actually remove the user reference from the classes', async () => {
				const { testUser1 } = await setup();

				await repo.removeUserReference(testUser1.toHexString());

				const result1 = await repo.findAllByUserId(testUser1.toHexString());
				expect(result1).toHaveLength(0);
			});

			it('should return count of 2 classes updated', async () => {
				const { testUser1 } = await setup();

				const numberOfUpdatedClasses = await repo.removeUserReference(testUser1.toHexString());

				expect(numberOfUpdatedClasses).toEqual(2);
			});

			it('should not affect other users in same classes', async () => {
				const { testUser1, class1, testUser2 } = await setup();

				await repo.removeUserReference(testUser1.toHexString());

				const classes = await repo.findClassById(class1.id);
				expect(classes?.userIds).toEqual([testUser2.toHexString()]);
			});

			it('should not affect other classes', async () => {
				const { testUser1, testUser3 } = await setup();

				await repo.removeUserReference(testUser1.toHexString());

				const result = await repo.findAllByUserId(testUser3.toHexString());
				expect(result).toHaveLength(2);
			});
		});
	});

	describe('findClassById', () => {
		describe('when class is not found in classes', () => {
			it('should return null', async () => {
				const result = await repo.findClassById(new ObjectId().toHexString());

				expect(result).toEqual(null);
			});
		});

		describe('when class is in classes', () => {
			const setup = async () => {
				const class1 = classEntityFactory.buildWithId();
				await em.persistAndFlush([class1]);
				em.clear();

				return {
					class1,
				};
			};

			it('should find class with particular classId', async () => {
				const { class1 } = await setup();

				const result = await repo.findClassById(class1.id);

				expect(result?.id).toEqual(class1.id);
			});
		});
	});

	describe('findClassWithSchoolIdAndExternalId', () => {
		describe('when class is found with schoolId and externalId', () => {
			const setup = async () => {
				const classes = classEntityFactory.buildListWithId(3, {
					gradeLevel: 5,
					sourceOptions: { tspUid: randomUUID() },
				});

				await em.persistAndFlush(classes);
				em.clear();

				return {
					classes,
				};
			};

			it('should return class', async () => {
				const { classes } = await setup();
				const class1 = classes[0];

				const result = await repo.findClassWithSchoolIdAndExternalId(
					class1.schoolId.toString(),
					class1.sourceOptions?.tspUid || ''
				);

				expect(result).toEqual(ClassMapper.mapToDO(class1));
			});
		});

		describe('when class is not found with schoolId and externalId', () => {
			it('should return null', async () => {
				const result = await repo.findClassWithSchoolIdAndExternalId(new ObjectId().toHexString(), randomUUID());

				expect(result).toEqual(null);
			});
		});
	});

	describe('save', () => {
		describe('when saving a single class', () => {
			const setup = () => {
				const count = 3;
				const classes = classEntityFactory.buildListWithId(count, { gradeLevel: 5 }).map((c) => ClassMapper.mapToDO(c));

				return {
					classes,
					count,
				};
			};

			it('should save the class', async () => {
				const { classes, count } = setup();

				await repo.save(classes);

				const result = await em.count(ClassEntity, {});

				expect(result).toEqual(count);
			});
		});
	});
});
