import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { TeamDeletedEvent } from '@modules/teams';
import { CourseDeletedEvent } from '../learnroom/event/course-deleted.event';
import { TeamEventDeletedEvent } from '../teams/event/team-event-deleted.event';
import { UserDeletedEvent } from '../user';

@Injectable()
export class EventPublisherService {
	constructor(private readonly eventBus: EventBus) {}

	publishFeathersEvent(eventType: string, payload: Record<string, unknown>) {
		let event: IEvent;

		if (eventType === 'course:deleted') {
			event = new CourseDeletedEvent(payload.courseId as EntityId);
		} else if (eventType === 'teamEvent:deleted') {
			event = new TeamEventDeletedEvent(payload.eventId as EntityId);
		} else if (eventType === 'user:deleted') {
			event = new UserDeletedEvent(payload.userId as EntityId);
		} else if (eventType === 'team:deleted') {
			event = new TeamDeletedEvent(payload.teamId as EntityId);
		} else {
			throw new InternalServerErrorException('Unknown event type');
		}

		this.eventBus.publish(event);
	}
}
