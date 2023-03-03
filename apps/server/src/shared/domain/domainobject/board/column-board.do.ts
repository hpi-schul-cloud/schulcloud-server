import { EntityId } from '@shared/domain/types';
import { Column } from './column.do';

export class ColumnBoard implements ColumnBoardProps {
	id: EntityId;

	title: string;

	columns: Column[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: ColumnBoardProps) {
		this.id = props.id;
		this.title = props.title;
		this.columns = props.columns;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

interface ColumnBoardProps {
	id: EntityId;

	title: string;

	columns: Column[];

	createdAt: Date;

	updatedAt: Date;
}
