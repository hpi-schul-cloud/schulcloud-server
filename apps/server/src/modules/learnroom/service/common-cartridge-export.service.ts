import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ICommonCartridgeAssignmentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-assignment-element';
import { ICommonCartridgeLessonContentProps } from '@src/modules/learnroom/common-cartridge/common-cartridge-lesson-content-element';
import { IComponentProperties, IComponentTextProperties } from '@src/shared/domain/entity/lesson.entity';
import { CourseService } from './course.service';
import {
	hasShape,
	ICommonCartridgeOrganizationProps,
	ICommonCartridgeResourceProps,
	CommonCartridgeFileBuilder,
	CommonCartridgeVersion,
} from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion = CommonCartridgeVersion.V_1_1_0
	): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		const builder = new CommonCartridgeFileBuilder({
			identifier: `i${course.id}`,
			title: course.name,
			version,
		});
		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization(this.mapLessonToOrganization(lesson, version));
			lesson.contents.forEach((content) => {
				organizationBuilder.addResourceToOrganization(this.mapContentToResource(content));
			});
		});

		// const [tasks] = await this.taskService.findBySingleParent(userId, courseId);
		// const builder = new CommonCartridgeFileBuilder({
		// 	identifier: `i${course.id}`,
		// 	title: course.name,
		// })
		// 	.addOrganizationItems(this.mapLessonsToOrganizationItems(lessons))
		// 	.addAssignments(this.mapTasksToAssignments(tasks));
		// return builder.build();


		return builder.build();
	}

	private mapLessonToOrganization(lesson: Lesson, version: CommonCartridgeVersion): ICommonCartridgeOrganizationProps {
		return {
			identifier: `i${lesson.id}`,
			version,
			title: lesson.name,
			resources: [],
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private mapContentToResource(content: IComponentProperties): ICommonCartridgeResourceProps {
		throw new Error('Method not implemented.');
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

			if (hasShape<IComponentTextProperties>(content, [['text', 'string']])) {
				mappedContent = content.text;
			}

			return {
				identifier: `i${content._id as string}`,
				title: content.title as string,
				content: mappedContent,
			};
		});
	}
}
