import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ClassEntity } from '@modules/class/entity';
import { classEntityFactory } from '@modules/class/entity/testing';
import { Group } from '@modules/group';
import { GroupEntity } from '@modules/group/entity';
import { Test, TestingModule } from '@nestjs/testing';
import { Course as CourseEntity, CourseFeatures, CourseGroup, SchoolEntity, User } from '@shared/domain/entity';
import {
	cleanupCollections,
	courseFactory as courseEntityFactory,
	courseGroupFactory as courseGroupEntityFactory,
	groupEntityFactory,
	groupFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import { Course, COURSE_REPO, CourseProps } from '../../domain';
import { courseFactory } from '../../testing';
import { CourseMikroOrmRepo } from './course.repo';
import { CourseEntityMapper } from './mapper/course.entity.mapper';

describe(CourseMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: CourseMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
				const entity: CourseEntity = courseEntityFactory.build();

				await em.persistAndFlush([entity]);
				em.clear();

				const course: Course = CourseEntityMapper.mapEntityToDo(entity);

				return { course };
			};

			it('should return course', async () => {
				const { course } = await setup();

				const result: Course = await repo.findCourseById(course.id);

				expect(result).toEqual(course);
			});
		});
	});

	describe('findBySyncedGroup', () => {
		describe('when a course is synced with a group', () => {
			const setup = async () => {
				const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
				const syncedCourseEntity: CourseEntity = courseEntityFactory.build({ syncedWithGroup: groupEntity });
				const otherCourseEntity: CourseEntity = courseEntityFactory.build({ syncedWithGroup: undefined });
				const group: Group = groupFactory.build({ id: groupEntity.id });

				await em.persistAndFlush([syncedCourseEntity, groupEntity, otherCourseEntity]);
				em.clear();

				const course: Course = CourseEntityMapper.mapEntityToDo(syncedCourseEntity);

				return {
					course,
					group,
				};
			};

			it('should return courses', async () => {
				const { course, group } = await setup();

				const result: Course[] = await repo.findBySyncedGroup(group);

				expect(result).toEqual([course]);
			});
		});
	});

	describe('save', () => {
		describe('when entity is new', () => {
			const setup = async () => {
				const entity: CourseEntity = courseEntityFactory.build();

				await em.persistAndFlush([entity.school]);
				em.clear();

				const course: Course = CourseEntityMapper.mapEntityToDo(entity);

				return { course };
			};

			it('should save entity', async () => {
				const { course } = await setup();

				const result: Course = await repo.save(course);

				expect(result).toEqual(course);
			});
		});

		describe('when entity is existing', () => {
			const setup = async () => {
				const courseEntity: CourseEntity = courseEntityFactory.buildWithId();
				const userEntity: User = userFactory.buildWithId();
				const schoolEntity: SchoolEntity = schoolEntityFactory.buildWithId();
				const groupEntity: GroupEntity = groupEntityFactory.buildWithId();
				const classEntity: ClassEntity = classEntityFactory.buildWithId();
				const courseGroupEntity: CourseGroup = courseGroupEntityFactory.buildWithId();

				await em.persistAndFlush([courseEntity, userEntity, schoolEntity, groupEntity, classEntity, courseGroupEntity]);
				em.clear();

				const expectedProps: CourseProps = {
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
					shareToken: 'shareToken',
					untilDate: new Date(),
					startDate: new Date(),
				};
				const newCourse: Course = courseFactory.build(expectedProps);

				return { newCourse, expectedProps };
			};

			it('should update entity', async () => {
				const { newCourse, expectedProps } = await setup();

				const result: Course = await repo.save(newCourse);

				expect(result).toEqual(newCourse);

				const updatedCourse = await repo.findCourseById(newCourse.id);
				expect(updatedCourse.getProps()).toEqual(expect.objectContaining(expectedProps));
			});
		});
	});
});
