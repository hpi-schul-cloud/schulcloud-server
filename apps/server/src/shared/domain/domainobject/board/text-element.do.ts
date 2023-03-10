import { EntityId } from '../../types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class TextElement implements TextElementProps, BoardNodeBuildable {
	id: EntityId;

	text: string;

	createdAt: Date;

	updatedAt: Date;

	constructor(props: TextElementProps) {
		this.id = props.id;
		this.text = props.text;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId): void {
		builder.buildTextElementNode(this, parentId);
	}
}

export interface TextElementProps {
	id: EntityId;

	text: string;

	createdAt: Date;

	updatedAt: Date;
}
