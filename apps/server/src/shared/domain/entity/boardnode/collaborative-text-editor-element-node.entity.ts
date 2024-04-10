import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.COLLABORATIVE_TEXT_EDITOR })
export class CollaborativeTextEditorElementNode extends BoardNode {
	@Property()
	editorId!: string;

	constructor(props: CollaborativeTextEditorElementNodeProps) {
		super(props);
		this.type = BoardNodeType.COLLABORATIVE_TEXT_EDITOR;
		this.editorId = props.editorId;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildCollaborativeTextEditorElement(this);

		return domainObject;
	}
}

export interface CollaborativeTextEditorElementNodeProps extends BoardNodeProps {
	editorId: string;
}
