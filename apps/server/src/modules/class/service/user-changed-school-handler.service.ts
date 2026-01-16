import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { ClassesRepo } from '../repo';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly classesRepo: ClassesRepo, private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(event: UserChangedSchoolEvent): Promise<void> {
		const classes = await this.classesRepo.findAllByUserId(event.userId);
		await this.classesRepo.removeUserReference(
			event.userId,
			classes.map((c) => c.id)
		);
	}
}
