import { EntityId } from '@shared/domain/types';
import { Column } from './column.do';
import { BoardNodeBuildable } from './types/board-node-buildable';
import { BoardNodeBuilder } from './types/board-node-builder';

export class ColumnBoard implements ColumnBoardProps, BoardNodeBuildable {
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

	addColumn(column: Column, position?: number) {
		this.columns.splice(position || this.columns.length, 0, column);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId): void {
		builder.buildColumnBoardNode(this, parentId);
	}
}

export interface ColumnBoardProps {
	id: EntityId;

	title: string;

	columns: Column[];

	createdAt: Date;

	updatedAt: Date;
}
