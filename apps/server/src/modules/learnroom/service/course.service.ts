import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(CourseService.name);
	}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		return [courses, count];
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Deleting data from Courses for user ', userId });
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: Course) => course.removeUser(userId));

		await this.repo.save(courses);
		this.logger.log({ action: 'Deleting data from Courses for user ', userId });

		return count;
	}

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}
}
