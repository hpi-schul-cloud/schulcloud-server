import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { courseFactory } from '../../testing';
import { Course } from '../course.do';
import { COURSE_REPO, CourseFilter, CourseRepo } from '../interface';
import { CourseDoService } from './course-do.service';

describe(CourseDoService.name, () => {
	let module: TestingModule;
	let service: CourseDoService;

	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseDoService,
				{
					provide: COURSE_REPO,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseDoService);
		courseRepo = module.get(COURSE_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				courseRepo.findCourseById.mockResolvedValueOnce(course);

				return {
					course,
				};
			};

			it('should return the group', async () => {
				const { course } = setup();

				const result: Course = await service.findById(course.id);

				expect(result).toEqual(course);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				courseRepo.findCourseById.mockImplementationOnce(() => {
					throw new NotFoundLoggableException(Course.name, { id: course.id });
				});

				return {
					course,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { course } = setup();

				await expect(service.findById(course.id)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('save', () => {
		const setup = () => {
			const course: Course = courseFactory.build();

			courseRepo.save.mockResolvedValueOnce(course);

			return {
				course,
			};
		};

		it('should save all courses', async () => {
			const { course } = setup();

			await service.save(course);

			expect(courseRepo.save).toHaveBeenCalledWith(course);
		});

		it('should return the saved courses', async () => {
			const { course } = setup();

			const result = await service.save(course);

			expect(result).toEqual(course);
		});
	});

	describe('saveAll', () => {
		const setup = () => {
			const course: Course = courseFactory.build();

			courseRepo.saveAll.mockResolvedValueOnce([course]);

			return {
				course,
			};
		};

		it('should save all courses', async () => {
			const { course } = setup();

			await service.saveAll([course]);

			expect(courseRepo.saveAll).toHaveBeenCalledWith([course]);
		});

		it('should return the saved courses', async () => {
			const { course } = setup();

			const result: Course[] = await service.saveAll([course]);

			expect(result).toEqual([course]);
		});
	});

	describe('findBySyncedGroup', () => {
		const setup = () => {
			const course: Course = courseFactory.build();
			const group: Group = groupFactory.build();

			courseRepo.findBySyncedGroup.mockResolvedValueOnce([course]);

			return {
				course,
				group,
			};
		};

		it('should return the synced courses', async () => {
			const { course, group } = setup();

			const result: Course[] = await service.findBySyncedGroup(group);

			expect(result).toEqual([course]);
		});
	});

	describe('findCourses', () => {
		describe('when course are found', () => {
			const setup = () => {
				const courses: Course[] = courseFactory.buildList(5);
				const schoolId: EntityId = new ObjectId().toHexString();
				const filter: CourseFilter = { schoolId };
				const options: IFindOptions<Course> = {
					order: {
						name: SortOrder.asc,
					},
					pagination: {
						limit: 2,
						skip: 1,
					},
				};

				courseRepo.getCourseInfo.mockResolvedValueOnce(new Page<Course>(courses, 5));

				return {
					courses,
					schoolId,
					filter,
					options,
				};
			};

			it('should return the courses by passing filter and options', async () => {
				const { courses, filter, options } = setup();
				const result: Page<Course> = await service.getCourseInfo(filter, options);

				expect(result.data).toEqual(courses);
			});
		});
	});
});
