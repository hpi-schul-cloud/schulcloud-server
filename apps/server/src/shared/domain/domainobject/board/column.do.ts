import { BoardComposite } from './board-composite.do';
import { Card } from './card.do';
import type { AnyBoardDo, BoardNodeBuildable, BoardNodeBuilder } from './types';

export class Column extends BoardComposite implements BoardNodeBuildable {
	addChild(child: AnyBoardDo, position?: number) {
		if (child instanceof Card) {
			this._addChild(child, position);
		} else {
			throw new Error(`Cannot add child of type '${child.constructor.name}'`);
		}
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildColumnNode(this, parent);
	}
}
