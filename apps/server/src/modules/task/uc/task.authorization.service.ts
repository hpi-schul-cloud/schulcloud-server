import { Injectable } from '@nestjs/common';
import { EntityId, Course, Lesson } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';

export enum TaskParentPermission {
	read,
	write,
}

@Injectable()
export class TaskAuthorizationService {
	constructor(private readonly courseRepo: CourseRepo, private readonly lessonRepo: LessonRepo) {}

	// it should return also the scopePermissions for this user added to the entity .scopePermission: { userId, read: boolean, write: boolean }
	// then we can pass and allow only scoped courses to getPermittedLessonIds and validate read write of .scopePermission
	async getPermittedCourses(userId: EntityId, neededPermission: TaskParentPermission): Promise<Course[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === TaskParentPermission.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(userId);
		} else if (neededPermission === TaskParentPermission.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(userId);
		}

		return permittedCourses;
	}

	async getPermittedLessons(userId: EntityId, courses: Course[]): Promise<Lesson[]> {
		const writeCourses = courses.filter(
			(c) => c.getSubstitutionTeacherIds().includes(userId) || c.getTeacherIds().includes(userId)
		);
		const readCourses = courses.filter((c) => c.getStudentIds().includes(userId));

		const writeCourseIds = writeCourses.map((c) => c.id);
		const readCourseIds = readCourses.map((c) => c.id);

		// idea as combined query:
		// [{courseIds: onlyWriteCoursesIds}, { courseIds: onlyReadCourses, filter: { hidden: false }}]
		const [[writeLessons], [readLessons]] = await Promise.all([
			this.lessonRepo.findAllByCourseIds(writeCourseIds),
			this.lessonRepo.findAllByCourseIds(readCourseIds, { hidden: false }),
		]);

		const permittedLessons = [...writeLessons, ...readLessons];

		return permittedLessons;
	}
}
