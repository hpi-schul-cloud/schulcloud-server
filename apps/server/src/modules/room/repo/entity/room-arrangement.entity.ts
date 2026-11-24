import { Embeddable, Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { RoomArrangementItem, RoomGroupProps } from '../../domain/type';

export const ROOM_ARRANGEMENT_SCHEMA_VERSION = 2;

@Embeddable()
class RoomArrangementItemEmbeddable implements RoomArrangementItem {
	@Property({ nullable: false })
	id!: EntityId;
}

@Embeddable()
export class RoomGroupEmbeddable implements RoomGroupProps {
	@Property({ nullable: false })
	id!: EntityId;

	@Property({ nullable: false })
	name!: string;

	@Property({ nullable: false })
	collapsed!: boolean;

	@Property({ nullable: false })
	roomIds!: EntityId[];
}

export interface RoomArrangementEntityProps {
	userId: EntityId;
	items: RoomArrangementItem[];
	schemaVersion?: number;
	revision?: number;
	ungroupedRoomIds?: EntityId[];
	groups?: RoomGroupProps[];
	confirmGroupDeletion?: boolean;
	groupingHintDismissed?: boolean;
}

/**
 * One document per user (unique index on `user`).
 * Documents without `schemaVersion` are in the legacy shape (only `items`) and are converted on first access.
 * `items` is a derived compatibility projection (ungrouped rooms, then every group in order).
 */
@Entity({ tableName: 'roomarrangements' })
export class RoomArrangementEntity extends BaseEntityWithTimestamps implements RoomArrangementEntityProps {
	@Unique()
	@Property({ type: ObjectIdType, fieldName: 'user', nullable: false })
	userId!: EntityId;

	@Property({ nullable: true })
	schemaVersion?: number;

	@Property({ nullable: true })
	revision?: number;

	@Property({ nullable: true })
	ungroupedRoomIds?: EntityId[];

	@Embedded(() => RoomGroupEmbeddable, { array: true, nullable: true })
	groups?: RoomGroupEmbeddable[];

	@Property({ nullable: true })
	confirmGroupDeletion?: boolean;

	@Property({ nullable: true })
	groupingHintDismissed?: boolean;

	@Embedded(() => RoomArrangementItemEmbeddable, { array: true, nullable: false })
	items: RoomArrangementItemEmbeddable[] = [];
}
