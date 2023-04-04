import { EntityId } from '../../types';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class TextElement extends BoardComposite implements TextElementProps, BoardNodeBuildable {
	text: string;

	constructor(props: Omit<TextElementProps, 'children'>) {
		super({ ...props, children: [] });
		this.text = props.text;
	}

	addChild(child: AnyBoardDo) {
		throw new Error(`Cannot add children to TextElement. Object of type '${child.constructor.name}' given`);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildTextElementNode(this, parentId, position);
	}
}

export interface TextElementProps extends BoardCompositeProps {
	text: string;
}
