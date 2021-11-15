import { Injectable } from '@nestjs/common';
import { EntityId, Course } from '@shared/domain';
import { CourseRepo, LessonRepo } from '@shared/repo';

export enum TaskParentPermission {
	read,
	write,
}

@Injectable()
export class TaskAuthorizationService {
	constructor(private readonly courseRepo: CourseRepo, private readonly lessonRepo: LessonRepo) {}

	async getPermittedCourseIds(userId: EntityId, neededPermission: TaskParentPermission): Promise<EntityId[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === TaskParentPermission.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(userId, undefined, { select: ['_id'] });
		} else if (neededPermission === TaskParentPermission.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(userId, undefined, { select: ['_id'] });
		}

		const entityIds = permittedCourses.map((c) => c.id);

		return entityIds;
	}

	async getPermittedCourses(userId: EntityId, neededPermission: TaskParentPermission): Promise<Course[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === TaskParentPermission.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(userId);
		} else if (neededPermission === TaskParentPermission.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(userId);
		}

		return permittedCourses;
	}

	async getPermittedLessonIds(userId: EntityId, courseIds: EntityId[]): Promise<EntityId[]> {
		const [courses] = await this.courseRepo.findAllByUserId(userId, { courseIds });

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
		const permittedLessonIds = permittedLessons.map((c) => c.id);

		return permittedLessonIds;
	}
}
