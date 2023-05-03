import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { FileElement } from './file-element.do';
import { TextElement } from './text-element.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class Card extends BoardComposite implements CardProps, BoardNodeBuildable {
	height: number;

	constructor(props: CardProps) {
		super(props);
		this.title = props.title;
		this.height = props.height;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof TextElement || domainObject instanceof FileElement;
		return allowed;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildCardNode(this, parent);
	}
}

export interface CardProps extends BoardCompositeProps {
	height: number;
}
