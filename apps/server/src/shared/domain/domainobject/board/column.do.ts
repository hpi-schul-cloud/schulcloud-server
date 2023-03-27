import { EntityId } from '@shared/domain/types';
import { BoardComposite } from './board-composite.do';
import { Card } from './card.do';
import type { BoardNodeBuildable, BoardNodeBuilder } from './types';

export class Column extends BoardComposite implements BoardNodeBuildable {
	addCard(card: Card, position?: number) {
		this.children.splice(position || this.children.length, 0, card);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildColumnNode(this, parentId, position);
	}
}
