import { Inject, Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Course as CourseEntity } from '@shared/domain/entity';
import { DomainOperation } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { CourseRepo as LegacyCourseRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { Group } from '@src/modules/group/domain';
import { Course, COURSE_REPO, CourseRepo } from '../domain';

@Injectable()
export class CourseService {
	constructor(
		private readonly repo: LegacyCourseRepo,
		private readonly logger: Logger,
		@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo
	) {
		this.logger.setContext(CourseService.name);
	}

	async findById(courseId: EntityId): Promise<CourseEntity> {
		return this.repo.findById(courseId);
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<CourseEntity[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		return [courses, count];
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Courses',
				DomainName.COURSE,
				userId,
				StatusModel.PENDING
			)
		);
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: CourseEntity) => course.removeUser(userId));

		await this.repo.save(courses);

		const result = DomainOperationBuilder.build(
			DomainName.COURSE,
			OperationType.UPDATE,
			count,
			this.getCoursesId(courses)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed data from Courses',
				DomainName.COURSE,
				userId,
				StatusModel.FINISHED,
				0,
				count
			)
		);

		return result;
	}

	async findAllByUserId(userId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}

	async create(course: CourseEntity): Promise<void> {
		await this.repo.createCourse(course);
	}

	private getCoursesId(courses: CourseEntity[]): EntityId[] {
		return courses.map((course) => course.id);
	}

	async findOneForUser(courseId: EntityId, userId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId);
		return course;
	}

	public async saveAll(courses: Course[]): Promise<Course[]> {
		const savedCourses: Course[] = await this.courseRepo.saveAll(courses);

		return savedCourses;
	}

	public async findBySyncedGroup(group: Group): Promise<Course[]> {
		const courses: Course[] = await this.courseRepo.findBySyncedGroup(group);

		return courses;
	}

	public async findSyncedCourses(): Promise<Course[]> {
		const courses: Course[] = await this.courseRepo.findSyncedCourses();

		return courses;
		// TODO: test
	}
}
