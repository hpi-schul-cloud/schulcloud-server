import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseEntity, CourseRepo } from '../../repo';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo, private readonly logger: Logger) {
		this.logger.setContext(CourseService.name);
	}

	public findById(courseId: EntityId): Promise<CourseEntity> {
		const course = this.repo.findById(courseId);

		return course;
	}

	public async findAllCoursesByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId, filters, options);

		return [courses, count];
	}

	public async findAllByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllByUserId(userId, filters, options);

		return courses;
	}

	public async create(course: CourseEntity): Promise<CourseEntity> {
		const result = await this.repo.createCourse(course);

		return result;
	}

	public async save(course: CourseEntity): Promise<void> {
		await this.repo.save(course);
	}

	public async findAllForTeacherOrSubstituteTeacher(userId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllForTeacherOrSubstituteTeacher(userId);

		return courses;
	}

	public async findOneForUser(courseId: EntityId, userId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId);

		return course;
	}
}
