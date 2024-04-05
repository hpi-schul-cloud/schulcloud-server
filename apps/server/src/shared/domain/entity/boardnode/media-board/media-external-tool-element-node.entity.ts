import { Entity, ManyToOne } from '@mikro-orm/core';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import type { AnyBoardDo, MediaExternalToolElement } from '../../../domainobject';
import { BoardNode, type BoardNodeProps } from '../boardnode.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

@Entity({ discriminatorValue: BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT })
export class MediaExternalToolElementNode extends BoardNode {
	@ManyToOne()
	contextExternalTool: ContextExternalToolEntity;

	constructor(props: MediaExternalToolElementNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT;
		this.contextExternalTool = props.contextExternalTool;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaExternalToolElement = builder.buildMediaExternalToolElement(this);
		return domainObject;
	}
}

export interface MediaExternalToolElementNodeProps extends BoardNodeProps {
	contextExternalTool: ContextExternalToolEntity;
}
