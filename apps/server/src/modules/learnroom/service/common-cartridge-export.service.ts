import { Injectable } from '@nestjs/common';
import { Course, EntityId, IComponentProperties, Task } from '@shared/domain';
import { LessonService } from '@src/modules/lesson/service';
import { ComponentType } from '@src/shared/domain/entity/lesson.entity';
import { TaskService } from '@src/modules/task/service';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
	ICommonCartridgeResourceProps,
	ICommonCartridgeWebContentResourceProps,
} from '../common-cartridge';
import { CourseService } from './course.service';
import { createIdentifier } from '../common-cartridge/utils';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: createIdentifier(courseId),
			title: course.name,
			version,
			copyrightOwners: this.mapCourseTeachersToCopyrightOwners(course),
			creationYear: course.createdAt.getFullYear().toString(),
		});

		await this.addLessons(builder, version, courseId);
		await this.addTasks(builder, version, courseId, userId);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		courseId: EntityId
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization({
				version,
				identifier: createIdentifier(lesson.id),
				title: lesson.name,
				resources: [],
			});

			lesson.contents.forEach((content) => {
				const resourceProps = this.mapContentToResource(lesson.id, content, version);
				if (resourceProps) {
					organizationBuilder.addResourceToOrganization(resourceProps);
				}
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		courseId: EntityId,
		userId: EntityId
	): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);
		const organizationBuilder = builder.addOrganization({
			version,
			identifier: createIdentifier(),
			// FIXME: change the title for tasks organization
			title: '',
			resources: [],
		});

		tasks.forEach((task) => {
			organizationBuilder.addResourceToOrganization(this.mapTaskToWebContentResource(task, version));
		});
	}

	private mapContentToResource(
		lessonId: string,
		content: IComponentProperties,
		version: CommonCartridgeVersion
	): ICommonCartridgeResourceProps | undefined {
		const commonProps = {
			version,
			identifier: createIdentifier(content._id),
			href: `${createIdentifier(lessonId)}/${createIdentifier(content._id)}.html`,
			title: content.title,
		};

		if (content.component === ComponentType.TEXT) {
			return {
				version,
				identifier: createIdentifier(content._id),
				href: `${createIdentifier(lessonId)}/${createIdentifier(content._id)}.html`,
				title: content.title,
				type: CommonCartridgeResourceType.WEB_CONTENT,
				intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
			};
		}

		if (content.component === ComponentType.GEOGEBRA) {
			const url = `https://www.geogebra.org/m/${content.content.materialId}`;
			return version === CommonCartridgeVersion.V_1_3_0
				? { ...commonProps, type: CommonCartridgeResourceType.WEB_LINK_V3, url }
				: { ...commonProps, type: CommonCartridgeResourceType.WEB_LINK_V1, url };
		}

		if (content.component === ComponentType.ETHERPAD) {
			return version === CommonCartridgeVersion.V_1_3_0
				? { ...commonProps, type: CommonCartridgeResourceType.WEB_LINK_V3, url: content.content.url }
				: { ...commonProps, type: CommonCartridgeResourceType.WEB_LINK_V1, url: content.content.url };
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

	private mapTaskToWebContentResource(
		task: Task,
		version: CommonCartridgeVersion
	): ICommonCartridgeWebContentResourceProps {
		const taskIdentifier = createIdentifier(task.id);
		return {
			version,
			identifier: taskIdentifier,
			href: `${taskIdentifier}/${taskIdentifier}.html`,
			title: task.name,
			type: CommonCartridgeResourceType.WEB_CONTENT,
			html: `<h1>${task.name}</h1><p>${task.description}</p>`,
			intendedUse:
				version === CommonCartridgeVersion.V_1_1_0
					? CommonCartridgeIntendedUseType.UNSPECIFIED
					: CommonCartridgeIntendedUseType.ASSIGNMENT,
		};
	}
}
