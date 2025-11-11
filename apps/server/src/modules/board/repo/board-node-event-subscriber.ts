import { EntityManager, EntityName, EventArgs, EventSubscriber } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { BoardExternalReferenceType, BoardNodeType } from '../domain';
import { RoomBoardCreatedEvent } from '../domain/events/room-board-created.event';
import { RoomBoardDeletedEvent } from '../domain/events/room-board-deleted.event';
import { BoardNodeEntity } from './entity';

@Injectable()
export class BoardNodeEventSubscriber implements EventSubscriber<BoardNodeEntity> {
	constructor(private readonly em: EntityManager, private readonly eventBus: EventBus) {
		em.getEventManager().registerSubscriber(this);
	}

	public getSubscribedEntities(): EntityName<BoardNodeEntity>[] {
		return [BoardNodeEntity];
	}

	public afterCreate?(args: EventArgs<BoardNodeEntity>): void | Promise<void> {
		const { entity } = args;
		if (entity.type === BoardNodeType.COLUMN_BOARD && entity.context?.type === BoardExternalReferenceType.Room) {
			this.eventBus.publish(new RoomBoardCreatedEvent(args.entity.id, entity.context.id));
		}
	}

	public afterDelete(args: EventArgs<BoardNodeEntity>): void | Promise<void> {
		const { entity } = args;
		if (entity.type === BoardNodeType.COLUMN_BOARD && entity.context?.type === BoardExternalReferenceType.Room) {
			this.eventBus.publish(new RoomBoardDeletedEvent(args.entity.id, entity.context.id));
		}
	}
}
