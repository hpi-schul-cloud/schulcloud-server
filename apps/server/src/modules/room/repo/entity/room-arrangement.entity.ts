import { Embeddable, Embedded, Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { RoomArrangementItem as IRoomArrangementItem, RoomArrangementProps } from '../../domain/type';

@Embeddable()
class RoomArrangementItem implements IRoomArrangementItem {
	@Property({ nullable: false })
	id!: EntityId;
}

@Entity({ tableName: 'roomarrangements' })
export class RoomArrangementEntity extends BaseEntityWithTimestamps implements RoomArrangementProps {
	@Index()
	@Property({ type: ObjectIdType, fieldName: 'user', nullable: false })
	userId!: EntityId;

	@Embedded(() => RoomArrangementItem, { array: true, nullable: false })
	items: RoomArrangementItem[] = [];
}
