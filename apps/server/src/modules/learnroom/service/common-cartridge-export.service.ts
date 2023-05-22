import { Injectable } from '@nestjs/common';
import { Course, EntityId, Lesson, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { ICommonCartridgeLessonContentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-lesson-content-element';
import { IComponentProperties, IComponentTextProperties } from '@src/shared/domain/entity/lesson.entity';
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
			copyrightOwners: this.mapCourseTeachersToCopyrightOwners(course),
			currentYear: course.createdAt.toLocaleDateString(),
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
				contents: this.mapContentsToLesson(lesson.contents),
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

	/**
	 * This method gets the text contents of a Lesson as parameter and maps these to an array of Lesson content.
	 * @param IComponentProperties
	 * @return ICommonCartridgeLessonContentProps
	 * */
	private mapContentsToLesson(contents: IComponentProperties[]): ICommonCartridgeLessonContentProps[] {
		return contents.map((content) => {
			let mappedContent = '';

			if (content.content && (content.content as IComponentTextProperties).text) {
				mappedContent = (content.content as IComponentTextProperties).text;
			}

			return {
				identifier: `i${content._id as string}`,
				title: content.title as string,
				content: mappedContent,
			};
		});
	}

	/**
	 * This method gets the course as parameter and maps the contained teacher names within the teachers Collection to a string.
	 * @param Course
	 * @return string
	 * */
	private mapCourseTeachersToCopyrightOwners(course: Course): string {
		const result = course.teachers
			.toArray()
			.map((teacher) => `${teacher.firstName} ${teacher.lastName}`)
			.reduce((previousTeachers, currentTeacher) => `${previousTeachers}, ${currentTeacher}`);
		return result;
	}
}
