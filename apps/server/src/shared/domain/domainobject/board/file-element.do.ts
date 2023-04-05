import { EntityId } from '../../types';
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

	addChild(child: AnyBoardDo) {
		throw new Error(`Cannot add children to FileElement. Object of type '${child.constructor.name}' given`);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildFileElementNode(this, parentId, position);
	}
}

export interface FileElementProps extends BoardCompositeProps {
	description: string;
}
