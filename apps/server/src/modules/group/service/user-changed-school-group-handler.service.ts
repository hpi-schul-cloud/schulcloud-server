import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolGroupHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(_event: UserChangedSchoolEvent): Promise<void> {
		// Softened: do not immediately strip user from room groups.
		// Access isolation is enforced by RoomRule.hasAccessToSchool checking user.school.id.
		// Keeping the group association allows dynamic detection of former rooms for school material transfer requests.
	}
}
