import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { GroupRepo } from '../repo/group.repo';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolGroupHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly groupRepo: GroupRepo, private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(event: UserChangedSchoolEvent): Promise<void> {
		await this.groupRepo.removeUserReference(event.userId);
	}
}
