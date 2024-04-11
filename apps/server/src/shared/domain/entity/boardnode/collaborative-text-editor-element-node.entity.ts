import { Entity } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.COLLABORATIVE_TEXT_EDITOR })
export class CollaborativeTextEditorElementNode extends BoardNode {
	constructor(props: BoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLLABORATIVE_TEXT_EDITOR;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildCollaborativeTextEditorElement(this);

		return domainObject;
	}
}
