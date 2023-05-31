import { Injectable } from '@nestjs/common';
import { EntityId, Lesson, IComponentProperties, Course } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { TaskService } from '@src/modules/task/service/task.service';
import { ComponentType } from '@src/shared/domain/entity/lesson.entity';
import { CourseService } from './course.service';
import {
	ICommonCartridgeOrganizationProps,
	ICommonCartridgeResourceProps,
	CommonCartridgeFileBuilder,
	CommonCartridgeResourceType,
} from '../common-cartridge';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: string): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		const builder = new CommonCartridgeFileBuilder({
			identifier: `i${course.id}`,
			title: course.name,
			version,
			copyrightOwners: this.mapCourseTeachersToCopyrightOwners(course),
			creationYear: course.createdAt.getFullYear().toString(),
		});
		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization(this.mapLessonToOrganization(lesson, version));
			lesson.contents.forEach((content) => {
				const resourceProps = this.mapContentToResource(lesson.id, content, version);
				if (resourceProps) {
					organizationBuilder.addResourceToOrganization(resourceProps);
				}
			});
		});

		// TODO: add tasks as assignments, will be done in EW-526: https://ticketsystem.dbildungscloud.de/browse/EW-526
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

	private mapLessonToOrganization(lesson: Lesson, version: string): ICommonCartridgeOrganizationProps {
		return {
			identifier: `i${lesson.id}`,
			version,
			title: lesson.name,
			resources: [],
		};
	}

	private mapContentToResource(
		lessonId: string,
		content: IComponentProperties,
		version: string
	): ICommonCartridgeResourceProps | undefined {
		if (content.component === ComponentType.TEXT) {
			return {
				version,
				type: CommonCartridgeResourceType.WEB_CONTENT,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id as string}.html`,
				title: content.title,
				html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
			};
		}

		if (content.component === ComponentType.GEOGEBRA) {
			return {
				version,
				type: CommonCartridgeResourceType.WEB_LINK,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id as string}.xml`,
				title: content.title,
				url: `https://www.geogebra.org/m/${content.content.materialId}`,
			};
		}

		if (content.component === ComponentType.ETHERPAD) {
			return {
				version,
				type: CommonCartridgeResourceType.WEB_LINK,
				identifier: `i${content._id as string}`,
				href: `i${lessonId}/i${content._id as string}.xml`,
				title: content.title,
				url: content.content.url,
			};
		}

		return undefined;
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
