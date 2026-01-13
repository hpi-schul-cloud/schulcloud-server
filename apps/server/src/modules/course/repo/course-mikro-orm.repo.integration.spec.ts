import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { classEntityFactory } from '@modules/class/entity/testing';
import { groupEntityFactory, groupFactory } from '@modules/group/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { COURSE_REPO, Course, CourseStatus, CourseSyncAttribute } from '../domain';
import { courseEntityFactory, courseFactory, courseGroupEntityFactory } from '../testing';
import { CourseMikroOrmRepo } from './course-mikro-orm.repo';
import { CourseEntity, CourseFeatures } from './course.entity';
import { CourseGroupEntity } from './coursegroup.entity';
import { CourseEntityMapper } from './mapper/course.entity.mapper';

describe(CourseMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: CourseMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseEntity, CourseGroupEntity, User] })],
			providers: [{ provide: COURSE_REPO, useClass: CourseMikroOrmRepo }],
		}).compile();

		repo = module.get(COURSE_REPO);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findCourseById', () => {
		describe('when entity is not found', () => {
			it('should throw NotFound', async () => {
				const someId = new ObjectId().toHexString();

				await expect(() => repo.findCourseById(someId)).rejects.toThrow(NotFoundError);
			});
		});

		describe('when entity is found', () => {
			const setup = async () => {
				const entity = courseEntityFactory.build();

				await em.persist([entity]).flush();
				em.clear();

				const course = CourseEntityMapper.mapEntityToDo(entity);

				return { course };
			};

			it('should return course', async () => {
				const { course } = await setup();

				const result = await repo.findCourseById(course.id);

				expect(result).toEqual(course);
			});
		});
	});

	describe('findBySyncedGroup', () => {
		describe('when a course is synced with a group', () => {
			const setup = async () => {
				const groupEntity = groupEntityFactory.buildWithId();
				const syncedCourseEntity = courseEntityFactory.build({ syncedWithGroup: groupEntity });
				const otherCourseEntity = courseEntityFactory.build({ syncedWithGroup: undefined });
				const group = groupFactory.build({ id: groupEntity.id });

				await em.persist([syncedCourseEntity, groupEntity, otherCourseEntity]).flush();
				em.clear();

				const course = CourseEntityMapper.mapEntityToDo(syncedCourseEntity);

				return {
					course,
					group,
				};
			};

			it('should return courses', async () => {
				const { course, group } = await setup();

				const result = await repo.findBySyncedGroup(group);

				expect(result).toEqual([course]);
			});
		});
	});

	describe('save', () => {
		describe('when entity is new', () => {
			const setup = async () => {
				const entity = courseEntityFactory.build();

				await em.persist([entity.school]).flush();
				em.clear();

				const course = CourseEntityMapper.mapEntityToDo(entity);

				return { course };
			};

			it('should save entity', async () => {
				const { course } = await setup();

				const result = await repo.save(course);

				expect(result).toEqual(course);
			});
		});

		describe('when entity is existing', () => {
			const setup = async () => {
				const courseEntity = courseEntityFactory.buildWithId();
				const userEntity = userFactory.buildWithId();
				const schoolEntity = schoolEntityFactory.buildWithId();
				const groupEntity = groupEntityFactory.buildWithId();
				const classEntity = classEntityFactory.buildWithId();
				const courseGroupEntity = courseGroupEntityFactory.buildWithId();

				await em.persist([courseEntity, userEntity, schoolEntity, groupEntity, classEntity, courseGroupEntity]).flush();
				em.clear();

				const expectedProps = {
					id: courseEntity.id,
					name: `course 1`,
					features: new Set<CourseFeatures>([CourseFeatures.VIDEOCONFERENCE]),
					schoolId: schoolEntity.id,
					studentIds: [userEntity.id],
					teacherIds: [userEntity.id],
					substitutionTeacherIds: [userEntity.id],
					groupIds: [groupEntity.id],
					classIds: [classEntity.id],
					courseGroupIds: [courseGroupEntity.id],
					description: 'description',
					color: '#ACACAC',
					copyingSince: new Date(),
					syncedWithGroup: groupEntity.id,
					excludeFromSync: [CourseSyncAttribute.TEACHERS],
					shareToken: 'shareToken',
					untilDate: new Date(),
					startDate: new Date(),
				};
				const newCourse: Course = courseFactory.build(expectedProps);

				return { newCourse, expectedProps };
			};

			it('should update entity', async () => {
				const { newCourse, expectedProps } = await setup();

				const result = await repo.save(newCourse);

				expect(result).toEqual(newCourse);

				const updatedCourse = await repo.findCourseById(newCourse.id);
				expect(updatedCourse.getProps()).toEqual(expect.objectContaining(expectedProps));
			});
		});
	});

	describe('findCourses', () => {
		describe('when entitys are not found', () => {
			const setup = async () => {
				const schoolEntity = schoolEntityFactory.buildWithId();
				const courseEntities = courseEntityFactory.buildList(2, {
					school: schoolEntity,
					untilDate: new Date('2050-04-24'),
				});

				await em.persist([schoolEntity, ...courseEntities]).flush();
				em.clear();

				const filter = { schoolId: schoolEntity.id, status: CourseStatus.ARCHIVE };

				const courseDOs = courseEntities.map((courseEntity) => CourseEntityMapper.mapEntityToDo(courseEntity));
				return { courseDOs, filter };
			};

			it('should return empty array', async () => {
				const { filter } = await setup();

				const result = await repo.getCourseInfo(filter);

				expect(result.data).toEqual([]);
			});
		});

		describe('when entitys are found for school', () => {
			const setup = async () => {
				const schoolEntity = schoolEntityFactory.buildWithId();
				const courseEntities = courseEntityFactory.buildList(5, {
					school: schoolEntity,
					untilDate: new Date('1995-04-24'),
				});

				courseEntities.push(
					...courseEntityFactory.buildList(3, {
						school: schoolEntity,
						untilDate: new Date('2050-04-24'),
					})
				);

				await em.persist([schoolEntity, ...courseEntities]).flush();
				em.clear();

				const pagination = { skip: 0, limit: 10 };
				const options = {
					pagination,
					order: {
						name: SortOrder.desc,
					},
				};
				const filter = { schoolId: schoolEntity.id, status: CourseStatus.ARCHIVE };

				const courseDOs = courseEntities.map((courseEntity) => CourseEntityMapper.mapEntityToDo(courseEntity));

				return { courseDOs, options, filter };
			};

			it('should return archived courses', async () => {
				const { options, filter } = await setup();

				const result = await repo.getCourseInfo(filter, options);

				expect(result.data.length).toEqual(5);
				expect(result.total).toEqual(5);
			});

			it('should return current courses', async () => {
				const { options, filter } = await setup();

				filter.status = CourseStatus.CURRENT;
				const result = await repo.getCourseInfo(filter, options);

				expect(result.data.length).toEqual(3);
				expect(result.total).toEqual(3);
			});
		});
	});
});
