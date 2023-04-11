import { BoardComposite } from './board-composite.do';
import { Card } from './card.do';
import type { AnyBoardDo, BoardNodeBuildable, BoardNodeBuilder } from './types';

export class Column extends BoardComposite implements BoardNodeBuildable {
	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof Card;
		return allowed;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildColumnNode(this, parent);
	}
}
