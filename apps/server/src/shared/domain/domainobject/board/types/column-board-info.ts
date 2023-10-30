import { EntityId } from '@shared/domain/types/entity-id';

export type ColumnBoardInfo = {
	id: EntityId;
	title: string;
	createdAt: Date;
	updatedAt: Date;
};
