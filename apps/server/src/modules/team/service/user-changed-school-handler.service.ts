import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { TeamRepo } from '../repo/team.repo';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly teamRepo: TeamRepo, private readonly orm: MikroORM) {}

	public async handle(event: UserChangedSchoolEvent): Promise<void> {
		await this.teamRepo.removeUserReferences(event.userId);
	}
}
