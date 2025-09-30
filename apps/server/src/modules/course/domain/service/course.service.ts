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

	public async findAllByUserId(
		userId: EntityId,
		schoolId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId, schoolId, filters, options);

		return [courses, count];
	}

	public async create(course: CourseEntity): Promise<CourseEntity> {
		const result = await this.repo.createCourse(course);

		return result;
	}

	public async save(course: CourseEntity): Promise<void> {
		await this.repo.save(course);
	}

	public async findAllForTeacherOrSubstituteTeacher(userId: EntityId, schoolId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllForTeacherOrSubstituteTeacher(userId, schoolId);

		return courses;
	}

	public async findOneForUser(courseId: EntityId, userId: EntityId, schoolId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId, schoolId);

		return course;
	}
}
