import { Injectable } from '@nestjs/common';
import { EntityManager, EntityName, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { User } from './user.entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { EventBus } from '@nestjs/cqrs';
import { UserChangedSchoolEvent } from '../domain/events/user-changed-school.event';

@Injectable()
export class UserEventSubscriber implements EventSubscriber<User> {
	constructor(em: EntityManager, private readonly eventBus: EventBus) {
		em.getEventManager().registerSubscriber(this);
	}

	public getSubscribedEntities(): EntityName<User>[] {
		return [User];
	}

	public afterUpdate(args: EventArgs<User>): void {
		const { changeSet } = args;
		if (changeSet) {
			const oldSchool = changeSet.originalEntity?.school;
			const newSchool = changeSet.payload.school;
			if (oldSchool instanceof ObjectId && newSchool instanceof ObjectId && !oldSchool.equals(newSchool)) {
				this.eventBus.publish(new UserChangedSchoolEvent(args.entity.id, oldSchool.toHexString()));
			}
		}
	}
}
