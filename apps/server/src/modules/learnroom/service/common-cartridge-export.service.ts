import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeOrganizationBuilder,
	CommonCartridgeVersion,
} from '../../common-cartridge';
import { CommonCartridgeMapper } from '../mapper/common-cartridge.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	public constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly commonCartridgeMapper: CommonCartridgeMapper
	) {}

	public async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder({
			identifier: courseId,
			version,
		});

		builder.addMetadata(this.commonCartridgeMapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId, version);
		await this.addTasks(builder, courseId, userId, version);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		version: CommonCartridgeVersion
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			const organizationBuilder = builder.addOrganization(
				this.commonCartridgeMapper.mapLessonToOrganization(lesson)
			);

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(organizationBuilder, content);
			});

			lesson.getLessonLinkedTasks().forEach((task) => {
				organizationBuilder
					.addSubOrganization(this.commonCartridgeMapper.mapTaskToOrganization(task))
					.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion
	): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);

		tasks.forEach((task) => {
			builder
				.addOrganization(this.commonCartridgeMapper.mapTaskToOrganization(task))
				.addResource(this.commonCartridgeMapper.mapTaskToResource(task, version));
		});
	}

	private addComponentToOrganization(
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
