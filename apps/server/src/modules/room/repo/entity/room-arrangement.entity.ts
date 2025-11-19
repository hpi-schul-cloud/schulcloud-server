import { Embeddable, Embedded, Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { RoomArrangementItem, RoomArrangementProps } from '../../domain/type';

@Embeddable()
class RoomArrangementItemEmbeddable implements RoomArrangementItem {
	@Property({ nullable: false })
	id!: EntityId;
}

@Entity({ tableName: 'roomarrangements' })
export class RoomArrangementEntity extends BaseEntityWithTimestamps implements RoomArrangementProps {
	@Index()
	@Property({ type: ObjectIdType, fieldName: 'user', nullable: false })
	userId!: EntityId;

	@Embedded(() => RoomArrangementItemEmbeddable, { array: true, nullable: false })
	items: RoomArrangementItemEmbeddable[] = [];
}
