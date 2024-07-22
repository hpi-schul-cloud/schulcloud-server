import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Group, GroupDeletedEvent } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@src/core/logger';
import { Course, CourseSynchronizationStoppedLoggable } from '../domain';
import { CourseDoService } from './course-do.service';

@Injectable()
@EventsHandler(GroupDeletedEvent)
export class GroupDeletedHandlerService implements IEventHandler<GroupDeletedEvent> {
	constructor(
		private readonly courseService: CourseDoService,
		private readonly logger: Logger,
		private readonly orm: MikroORM
	) {}

	@UseRequestContext()
	public async handle(event: GroupDeletedEvent): Promise<void> {
		await this.removeCourseSyncReference(event.target);
	}

	private async removeCourseSyncReference(group: Group): Promise<void> {
		const courses: Course[] = await this.courseService.findBySyncedGroup(group);

		courses.forEach((course: Course): void => {
			course.students = [];
			course.syncedWithGroup = undefined;
		});

		await this.courseService.saveAll(courses);

		this.logger.info(new CourseSynchronizationStoppedLoggable(courses, group));
	}
}
