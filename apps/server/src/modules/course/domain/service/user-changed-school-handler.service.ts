import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';
import { CourseRepo } from '../../repo/course.repo';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly courseRepo: CourseRepo, private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(event: UserChangedSchoolEvent): Promise<void> {
		await this.courseRepo.removeUserFromCourses(event.userId, event.oldSchoolId);
	}
}
