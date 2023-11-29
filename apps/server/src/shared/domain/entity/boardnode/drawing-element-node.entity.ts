import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.DRAWING_ELEMENT })
export class DrawingElementNode extends BoardNode {
	@Property()
	description: string;

	constructor(props: DrawingElementNodeProps) {
		super(props);
		this.type = BoardNodeType.DRAWING_ELEMENT;
		this.description = props.description;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildDrawingElement(this);
		return domainObject;
	}
}

export interface DrawingElementNodeProps extends BoardNodeProps {
	description: string;
}
