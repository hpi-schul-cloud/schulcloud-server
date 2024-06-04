import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TestingModule } from '@nestjs/testing/testing-module';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { SchoolEntity } from '@shared/domain/entity';
import { cleanupCollections, schoolEntityFactory } from '@shared/testing';
import { classEntityFactory } from '../entity/testing/factory/class.entity.factory';
import { Class } from '../domain';
import { ClassEntity } from '../entity';
import { ClassesRepo } from './classes.repo';
import { ClassMapper } from './mapper';

describe(ClassesRepo.name, () => {
	let module: TestingModule;
	let repo: ClassesRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

	describe('findAllBySchoolId', () => {
		describe('when school has no class', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllBySchoolId(new ObjectId().toHexString());

				expect(result).toEqual([]);
			});
		});

		describe('when school has classes', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const classes: ClassEntity[] = classEntityFactory.buildListWithId(3, { schoolId: school.id });

				await em.persistAndFlush(classes);
				em.clear();

				return {
					school,
					classes,
				};
			};

			it('should find classes with particular userId', async () => {
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
				const class1: ClassEntity = classEntityFactory.withUserIds([testUser, new ObjectId()]).buildWithId();
				const class2: ClassEntity = classEntityFactory
					.withUserIds([new ObjectId()])
					.buildWithId({ teacherIds: [testUser] });
				const class3: ClassEntity = classEntityFactory.withUserIds([new ObjectId(), new ObjectId()]).buildWithId();

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

	describe.only('getClassesByIds', () => {
		describe('when multiple matching classes on same school exists', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const classesGrade5 = classEntityFactory.buildList(5, { schoolId: school.id, gradeLevel: 5 });
				const classesGrade8 = classEntityFactory.buildList(5, { schoolId: school.id, gradeLevel: 8 });
				const otherClasses = classEntityFactory.buildList(5, { schoolId: school.id });

				await em.persistAndFlush([...classesGrade5, ...classesGrade8, ...otherClasses]);
				em.clear();

				// orderBy sort it by gradeLevel AND name
				const classes5SortByName = classesGrade5.sort((a, b) => a.name.localeCompare(b.name));
				const classes8SortByName = classesGrade8.sort((a, b) => a.name.localeCompare(b.name));
				const classIds5 = classes5SortByName.map((classEntity) => classEntity.id);
				const classIds8 = classes8SortByName.map((classEntity) => classEntity.id);

				return { classIds: [...classIds5, ...classIds8], classes5SortByName, classes8SortByName };
			};

			it('should be find all requested classes', async () => {
				const { classIds } = await setup();

				const result = await repo.getClassesByIds(classIds);

				expect(result.length).toEqual(classIds.length);
			});

			it('Default orderBy should be 1 and sort it by gradeLevel and name', async () => {
				const { classIds, classes5SortByName, classes8SortByName } = await setup();

				const result = await repo.getClassesByIds(classIds);

				expect(result[0].name).toEqual(classes5SortByName[0].name);
				expect(result[4].name).toEqual(classes5SortByName[4].name);
				expect(result[5].name).toEqual(classes8SortByName[0].name);
				expect(result[9].name).toEqual(classes8SortByName[4].name);
			});

			it('Should work for orderBy 1 and sort it by gradeLevel and name', async () => {
				const { classIds, classes5SortByName, classes8SortByName } = await setup();

				const result = await repo.getClassesByIds(classIds, 1);

				expect(result[0].name).toEqual(classes5SortByName[0].name);
				expect(result[4].name).toEqual(classes5SortByName[4].name);
				expect(result[5].name).toEqual(classes8SortByName[0].name);
				expect(result[9].name).toEqual(classes8SortByName[4].name);
			});

			it('Should work for orderBy -1 and sort it by gradeLevel and name', async () => {
				const { classIds, classes5SortByName, classes8SortByName } = await setup();

				const result = await repo.getClassesByIds(classIds, -1);

				expect(result[0].name).toEqual(classes8SortByName[4].name);
				expect(result[4].name).toEqual(classes8SortByName[0].name);
				expect(result[5].name).toEqual(classes5SortByName[4].name);
				expect(result[9].name).toEqual(classes5SortByName[0].name);
			});
		});

		// same school?
		// year?
	});

	describe('updateMany', () => {
		describe('when deleting user data from classes', () => {
			const setup = async () => {
				const testUser1 = new ObjectId();
				const testUser2 = new ObjectId();
				const testUser3 = new ObjectId();
				const class1: ClassEntity = classEntityFactory.withUserIds([testUser1, testUser2]).buildWithId();
				const class2: ClassEntity = classEntityFactory.withUserIds([testUser1, testUser3]).buildWithId();
				const class3: ClassEntity = classEntityFactory.withUserIds([testUser2, testUser3]).buildWithId();

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

			it('should update classes without deleted user', async () => {
				const { class1, class2, testUser1, testUser2, testUser3 } = await setup();

				class1.userIds = [testUser2];
				class2.userIds = [testUser3];

				const updatedArray: ClassEntity[] = [class1, class2];
				const domainObjectsArray: Class[] = ClassMapper.mapToDOs(updatedArray);

				await repo.updateMany(domainObjectsArray);

				const result1 = await repo.findAllByUserId(testUser1.toHexString());
				expect(result1).toHaveLength(0);

				const result2 = await repo.findAllByUserId(testUser2.toHexString());
				expect(result2).toHaveLength(2);

				const result3 = await repo.findAllByUserId(testUser3.toHexString());
				expect(result3).toHaveLength(2);
			});
		});

		describe('when updating a class that does not exist', () => {
			const setup = async () => {
				const class1: ClassEntity = classEntityFactory.buildWithId();
				const class2: ClassEntity = classEntityFactory.buildWithId();

				await em.persistAndFlush([class1]);
				em.clear();

				return {
					class1,
					class2,
				};
			};

			it('should throw an error', async () => {
				const { class1, class2 } = await setup();

				const updatedArray: ClassEntity[] = [class1, class2];
				const domainObjectsArray: Class[] = ClassMapper.mapToDOs(updatedArray);

				await expect(repo.updateMany(domainObjectsArray)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});
});
