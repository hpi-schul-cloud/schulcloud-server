import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, Lesson, Task, User } from '@shared/domain';

export enum TaskParentPermission {
	read,
	write,
}

@Injectable()
export class RoomsAuthorisationService {
	hasCourseWritePermission(user: User, course: Course): boolean {
		const hasPermission = course.substitutionTeachers.contains(user) || course.teachers.contains(user);

		return hasPermission;
	}

	hasCourseReadPermission(user: User, course: Course): boolean {
		const hasPermission =
			course.students.contains(user) || course.substitutionTeachers.contains(user) || course.teachers.contains(user);

		return hasPermission;
	}

	hasTaskListPermission(user: User, task: Task): boolean {
		const isCreator = task.creator === user;
		let hasCoursePermission = false;

		if (task.lesson) {
			throw new NotImplementedException('rooms currenlty do not support tasks in lessons');
		}

		if (task.course) {
			hasCoursePermission = this.hasCourseReadPermission(user, task.course);

			if (task.private || (task.availableDate && task.availableDate > new Date(Date.now()))) {
				hasCoursePermission = this.hasCourseWritePermission(user, task.course);
			}
		}

		const hasPermission = isCreator || hasCoursePermission;

		return hasPermission;
	}

	hasTaskReadPermission(user: User, task: Task): boolean {
		let hasPermission = false;

		if (task.private) {
			const isCreator = task.creator === user;
			hasPermission = isCreator;
		} else {
			hasPermission = this.hasTaskListPermission(user, task);
		}

		return hasPermission;
	}

	hasLessonListPermission(user: User, lesson: Lesson): boolean {
		let hasCoursePermission = false;
		hasCoursePermission = this.hasCourseReadPermission(user, lesson.course);
		if (lesson.hidden) {
			hasCoursePermission = this.hasCourseWritePermission(user, lesson.course);
		}

		return hasCoursePermission;
	}
}
