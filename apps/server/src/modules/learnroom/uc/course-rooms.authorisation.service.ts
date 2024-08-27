import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, LessonEntity, Task, User } from '@shared/domain/entity';

export enum TaskParentPermission {
	read,
	write,
}

@Injectable()
export class CourseRoomsAuthorisationService {
	hasCourseWritePermission(user: User, course: Course): boolean {
		const hasPermission = course.substitutionTeachers.contains(user) || course.teachers.contains(user);

		return hasPermission;
	}

	hasCourseReadPermission(user: User, course: Course): boolean {
		const hasPermission =
			course.students.contains(user) || course.substitutionTeachers.contains(user) || course.teachers.contains(user);

		return hasPermission;
	}

	hasTaskReadPermission(user: User, task: Task): boolean {
		const isCreator = task.creator === user;
		let hasCoursePermission = false;

		if (task.lesson) {
			throw new NotImplementedException('rooms currenlty do not support tasks in lessons');
		}

		if (task.course) {
			hasCoursePermission = this.hasCourseReadPermission(user, task.course);

			if (!task.isPublished()) {
				hasCoursePermission = this.hasCourseWritePermission(user, task.course);
			}
		}

		const hasPermission = isCreator || hasCoursePermission;

		return hasPermission;
	}

	hasLessonReadPermission(user: User, lesson: LessonEntity): boolean {
		let hasCoursePermission = false;
		hasCoursePermission = this.hasCourseReadPermission(user, lesson.course);
		if (lesson.hidden) {
			hasCoursePermission = this.hasCourseWritePermission(user, lesson.course);
		}

		return hasCoursePermission;
	}
}
