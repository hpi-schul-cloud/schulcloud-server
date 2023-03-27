import { EntityId } from '../../types';
import { BoardComposite } from './board-composite.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class TextElement extends BoardComposite implements TextElementProps, BoardNodeBuildable {
	text: string;

	constructor(props: TextElementProps) {
		super(props);
		this.text = props.text;
	}

	addChild(child: AnyBoardDo) {
		throw new Error(`Cannot add children. Object of type '${child.constructor.name}' given`);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildTextElementNode(this, parentId, position);
	}
}

export interface TextElementProps {
	id: EntityId;

	text: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;
}
