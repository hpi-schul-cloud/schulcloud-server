import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(_event: UserChangedSchoolEvent): Promise<void> {
		// Softened: do not immediately strip teacher from courses.
		// Access isolation is enforced by checking user.school.id against course.school.
		// Keeping the association allows dynamic detection of former courses for school material transfer requests.
	}
}
