import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { ComponentProperties, EntityId } from '@shared/domain';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeVersion,
} from '../common-cartridge';
import { CommonCartridgeMapper } from '../mapper/common-cartridge.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly commonCartridgeMapper: CommonCartridgeMapper
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: courseId,
			version,
		});

		builder.addMetadata(this.commonCartridgeMapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId);
		await this.addTasks(builder, courseId, userId);

		return builder.build();
	}

	private async addLessons(builder: CommonCartridgeFileBuilder, courseId: EntityId): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization(
				this.commonCartridgeMapper.mapLessonToOrganization(lesson)
			);

			lesson.contents.forEach((content) => {
				this.addComponent(organizationBuilder, content);
			});
		});
	}

	private async addTasks(builder: CommonCartridgeFileBuilder, courseId: EntityId, userId: EntityId): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);

		tasks.forEach((task) => {
			const organization = builder.addOrganization(this.commonCartridgeMapper.mapTaskToOrganization(task));

			organization.addResource(this.commonCartridgeMapper.mapTaskToResource(task));
		});
	}

	private addComponent(
		organizationBuilder: CommonCartridgeOrganizationBuilder,
		component: ComponentProperties
	): void {
		const resources = this.commonCartridgeMapper.mapContentToResources(component);

		if (!Array.isArray(resources)) {
			organizationBuilder.addResource(resources);
		}

		if (Array.isArray(resources)) {
			const subOrganizationBuilder = organizationBuilder.addSubOrganization(
				this.commonCartridgeMapper.mapContentToOrganization(component)
			);

			resources.forEach((resource) => {
				subOrganizationBuilder.addResource(resource);
			});
		}
	}
}
