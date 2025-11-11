import { Embeddable, Embedded, Entity, Index, Property } from '@mikro-orm/core';
import { RoomContentProps, RoomContentType } from '../../domain/type';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';

// Separate entity for room content to keep it independent from rooms and allow user-specific content storage.
@Embeddable()
class RoomContentItem {
	@Property({ nullable: false })
	id!: EntityId;

	@Property({ nullable: false })
	type!: RoomContentType;
}

@Entity({ tableName: 'roomcontents' })
export class RoomContentEntity extends BaseEntityWithTimestamps implements RoomContentProps {
	@Index()
	@Property({ type: ObjectIdType, fieldName: 'room', nullable: false })
	roomId!: EntityId;

	@Embedded(() => RoomContentItem, { array: true, nullable: false })
	items: RoomContentItem[] = [];
}
