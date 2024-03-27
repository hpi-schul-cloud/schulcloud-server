import { Group, GroupDeletedEvent } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Course } from '../domain';
import { CourseDoService } from './course-do.service';

@Injectable()
@EventsHandler(GroupDeletedEvent)
export class GroupDeletedHandlerService implements IEventHandler<GroupDeletedEvent> {
	constructor(private readonly courseService: CourseDoService) {}

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
	}
}
