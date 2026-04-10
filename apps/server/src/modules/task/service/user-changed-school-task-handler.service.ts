import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { TaskRepo } from '../repo/task.repo';

@Injectable()
@EventsHandler(UserChangedSchoolEvent)
export class UserChangedSchoolTaskHandlerService implements IEventHandler<UserChangedSchoolEvent> {
	constructor(private readonly taskRepo: TaskRepo, private readonly orm: MikroORM) {}

	@EnsureRequestContext()
	public async handle(event: UserChangedSchoolEvent): Promise<void> {
		await this.taskRepo.deleteAllPrivateTasksByTeacherId(event.userId);
	}
}
