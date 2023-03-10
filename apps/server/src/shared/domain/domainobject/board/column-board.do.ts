import type { BoardNode } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Column } from './column.do';
import { BoardNodeBuildable, BoardNodeBuilder } from './types';

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

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: BoardNode): BoardNode[] {
		const boardNodes = builder.buildColumnBoardNode(this, parent);
		return boardNodes;
	}
}

interface ColumnBoardProps {
	id: EntityId;

	title: string;

	columns: Column[];

	createdAt: Date;

	updatedAt: Date;
}
