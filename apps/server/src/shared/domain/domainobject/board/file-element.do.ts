import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class FileElement extends BoardComposite implements FileElementProps, BoardNodeBuildable {
	description: string;

	constructor(props: Omit<FileElementProps, 'children'>) {
		super({ ...props, children: [] });
		this.description = props.description;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parent?: AnyBoardDo): void {
		builder.buildFileElementNode(this, parent);
	}
}

export interface FileElementProps extends BoardCompositeProps {
	description: string;
}
