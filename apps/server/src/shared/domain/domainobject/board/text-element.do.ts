import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class TextElement extends BoardComposite implements TextElementProps, BoardNodeBuildable {
	text: string;

	constructor(props: Omit<TextElementProps, 'children'>) {
		super({ ...props, children: [] });
		this.text = props.text;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildTextElementNode(this, parent);
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitTextElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitTextElementAsync(this);
	}
}

export interface TextElementProps extends BoardCompositeProps {
	text: string;
}
