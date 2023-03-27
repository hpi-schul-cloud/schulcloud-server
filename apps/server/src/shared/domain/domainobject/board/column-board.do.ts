import { BoardComposite } from './board-composite.do';
import { Column } from './column.do';
import { BoardNodeBuildable } from './types/board-node-buildable';
import { BoardNodeBuilder } from './types/board-node-builder';

export class ColumnBoard extends BoardComposite implements BoardNodeBuildable {
	addColumn(column: Column, position?: number) {
		this.children.splice(position || this.children.length, 0, column);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder): void {
		builder.buildColumnBoardNode(this);
	}
}
