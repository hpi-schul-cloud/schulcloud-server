import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class FileElement extends BoardComposite implements FileElementProps, BoardNodeBuildable {
	caption: string;

	constructor(props: Omit<FileElementProps, 'children'>) {
		super({ ...props, children: [] });
		this.caption = props.caption;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildFileElementNode(this, parent);
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitFileElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitFileElementAsync(this);
	}
}

export interface FileElementProps extends BoardCompositeProps {
	caption: string;
}
