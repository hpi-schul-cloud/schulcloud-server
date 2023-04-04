import { BoardComposite } from './board-composite.do';
import { Column } from './column.do';
import type { AnyBoardDo } from './types';
import { BoardNodeBuildable } from './types/board-node-buildable';
import { BoardNodeBuilder } from './types/board-node-builder';

export class ColumnBoard extends BoardComposite implements BoardNodeBuildable {
	addChild(child: AnyBoardDo, toIndex?: number) {
		if (child instanceof Column) {
			this._addChild(child, toIndex);
		} else {
			throw new Error(`Cannot add child of type '${child.constructor.name}'`);
		}
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder): void {
		builder.buildColumnBoardNode(this);
	}
}
