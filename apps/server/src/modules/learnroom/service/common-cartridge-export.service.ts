import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { CourseService } from './course.service';
import { ICommonCartridgeOrganizationProps, CommonCartridgeFileBuilder } from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: `i${course.id}`,
			title: course.name,
		})
			.addOrganizationItems(this.mapLessonsToOrganizationItems(lessons))
			.addAssignments(this.mapTasksToAssignments(tasks));
		return builder.build();
	}

	private mapLessonsToOrganizationItems(lessons: Lesson[]): ICommonCartridgeOrganizationProps[] {
		return lessons.map((lesson) => {
			return {
				identifier: `i${lesson.id}`,
				title: lesson.name,
				contents: lesson.contents,
			};
		});
	}

	private mapTasksToAssignments(tasks: Task[]): ICommonCartridgeAssignmentProps[] {
		return tasks.map((task) => {
			return {
				identifier: `i${task.id}`,
				title: task.name,
				description: task.description,
			};
		});
	}
}
