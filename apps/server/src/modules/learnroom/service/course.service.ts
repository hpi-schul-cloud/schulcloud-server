import { Injectable } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { Course, EntityId } from '@shared/domain';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<number> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		const updatedCourses = courses.map(
			(course: Course) =>
				({
					...course,
					students: course.students.remove((u) => u.id === userId),
					teachers: course.teachers.remove((u) => u.id === userId),
					substitutionTeachers: course.substitutionTeachers.remove((u) => u.id === userId),
				} as unknown as Course)
		);

		await this.repo.save(updatedCourses);

		return count;
	}
}
