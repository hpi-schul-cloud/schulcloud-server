import { EntityId } from '@shared/domain/types';

export type ColumnBoardInfo = {
	id: EntityId;
	title: string;
	createdAt: Date;
	updatedAt: Date;
};
