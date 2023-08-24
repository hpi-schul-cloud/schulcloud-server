import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.DRAWING_ELEMENT })
export class DrawingElementNode extends BoardNode {
	@Property()
	drawingName: string;

	constructor(props: DrawingElementNodeProps) {
		super(props);
		this.type = BoardNodeType.DRAWING_ELEMENT;
		this.drawingName = props.drawingName;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildDrawingElement(this);
		return domainObject;
	}
}

export interface DrawingElementNodeProps extends BoardNodeProps {
	drawingName: string;
}
