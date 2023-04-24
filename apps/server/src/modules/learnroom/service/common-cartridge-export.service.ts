import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { ICommonCartridgeLessonContentProps } from '@src/modules/learnroom/common-cartridge/common-cartrigde-lesson-content-element';
import { IComponentProperties } from '@src/shared/domain/entity/lesson.entity';
import { CourseService } from './course.service';
import { ICommonCartridgeOrganizationProps, CommonCartridgeFileBuilder } from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, lessonId?: EntityId): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		let lesson;
		if (lessonId) {
			lesson = await this.lessonService.findById(lessonId);
		}
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: `i${course.id}`,
			title: course.name,
		})
			.addOrganizationItems(this.mapLessonsToOrganizationItems(lessons))
			.addAssignments(this.mapTasksToAssignments(tasks));
		if (lesson) {
			builder.addLessonContents(this.mapContentsToLesson(lesson.contents));
		}
		return builder.build();
	}

	private mapLessonsToOrganizationItems(lessons: Lesson[]): ICommonCartridgeOrganizationProps[] {
		return lessons.map((lesson) => {
			return {
				identifier: `i${lesson.id}`,
				title: lesson.name,
				// contents: this.mapLessonContetnToOrganization(lesson.contents),
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

	/* 	private mapLessonContetnToOrganization(contents: IComponentProperties[]): ICommonCartridgeLessonContentProps[] | [] {
		return contents.map((item) => {
			return {
				title: item.title,
				content: item.content,
			};
		});
	} */

	private mapContentsToLesson(contents: IComponentProperties[]): ICommonCartridgeLessonContentProps[] {
		return contents.map((content) => {
			return {
				identifier: `i${content._id}`,
				title: content.title,
				content: content.content,
			};
		});
	}
}
