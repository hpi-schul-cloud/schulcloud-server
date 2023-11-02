import { LessonService } from '@modules/lesson/service';
import { TaskService } from '@modules/task/service';
import { Injectable } from '@nestjs/common';
import { Course, EntityId, IComponentProperties, Task } from '@shared/domain';
import { ComponentType } from '@src/shared/domain/entity/lesson.entity';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
	ICommonCartridgeResourceProps,
	ICommonCartridgeWebContentResourceProps,
} from '../common-cartridge';
import { createIdentifier } from '../common-cartridge/utils';
import { CourseService } from './course.service';

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
		const commonProps = (fileExt: 'html' | 'xml') => {
			return {
				version,
				identifier: createIdentifier(content._id),
				href: `${createIdentifier(lessonId)}/${createIdentifier(content._id)}.${fileExt}`,
				title: content.title,
			};
		};

		if (content.component === ComponentType.TEXT) {
			return {
				...commonProps('html'),
				type: CommonCartridgeResourceType.WEB_CONTENT,
				intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
				html: `<h1>${content.title}</h1><p>${content.content.text}</p>`,
			};
		}

		if (content.component === ComponentType.GEOGEBRA) {
			const url = `https://www.geogebra.org/m/${content.content.materialId}`;
			return version === CommonCartridgeVersion.V_1_3_0
				? { ...commonProps('xml'), type: CommonCartridgeResourceType.WEB_LINK_V3, url }
				: { ...commonProps('xml'), type: CommonCartridgeResourceType.WEB_LINK_V1, url };
		}

		if (content.component === ComponentType.ETHERPAD) {
			return version === CommonCartridgeVersion.V_1_3_0
				? {
						...commonProps('xml'),
						type: CommonCartridgeResourceType.WEB_LINK_V3,
						url: content.content.url,
						title: content.content.description,
				  }
				: {
						...commonProps('xml'),
						type: CommonCartridgeResourceType.WEB_LINK_V1,
						url: content.content.url,
						title: content.content.description,
				  };
		}

		if (content.component === ComponentType.LERNSTORE && content.content) {
			const { resources } = content.content;

			return version === CommonCartridgeVersion.V_1_3_0
				? { type: CommonCartridgeResourceType.WEB_LINK_V3, url: resources[0].url, ...commonProps('xml') }
				: { type: CommonCartridgeResourceType.WEB_LINK_V1, url: resources[0].url, ...commonProps('xml') };
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
