import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, IComponentProperties } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ComponentType } from '@src/shared/domain/entity/lesson.entity';
import { CourseService } from './course.service';
import {
	ICommonCartridgeOrganizationProps,
	ICommonCartridgeResourceProps,
	CommonCartridgeFileBuilder,
	CommonCartridgeVersion,
	CommonCartridgeResourceType,
} from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	defaultVersion = CommonCartridgeVersion.V_1_1_0;

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
				const resourceProps = this.mapContentToResource(lesson.id, content);
				if (resourceProps) {
					organizationBuilder.addResourceToOrganization(resourceProps);
				}
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

	private mapContentToResource(
		lessonId: string,
		content: IComponentProperties
	): ICommonCartridgeResourceProps | undefined {
		if (content.component === ComponentType.TEXT) {
			return {
				version: this.defaultVersion,
				type: CommonCartridgeResourceType.WEB_CONTENT,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id || ''}.html`,
				title: content.title || '',
				html: `<h1>${content.title || ''}</h1><p>${content.content.text}</p>`,
			};
		}

		if (content.component === ComponentType.GEOGEBRA) {
			return {
				version: this.defaultVersion,
				type: CommonCartridgeResourceType.LTI,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id || ''}.xml`,
				title: content.title || '',
				url: content.content.materialId,
			};
		}

		if (content.component === ComponentType.ETHERPAD) {
			return {
				version: this.defaultVersion,
				type: CommonCartridgeResourceType.WEB_LINK,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id || ''}.xml`,
				title: content.content.title,
				url: content.content.url,
			};
		}

		return undefined;
	}
}
