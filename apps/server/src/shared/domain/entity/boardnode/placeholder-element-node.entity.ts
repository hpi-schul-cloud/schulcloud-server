import { Entity } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.PLACEHOLDER })
export class PlaceholderElementNodeEntity extends BoardNode {
	previousElementDisplayName: string;

	previousElementType: string;

	constructor(props: PlaceholderElementNodeEntityProps) {
		super(props);
		this.type = BoardNodeType.PLACEHOLDER;
		this.title = '';
		this.previousElementDisplayName = props.previousElementDisplayName;
		this.previousElementType = props.previousElementType;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildPlaceholderElement(this);
		return domainObject;
	}
}

export interface PlaceholderElementNodeEntityProps extends BoardNodeProps {
	previousElementType: string;
	previousElementDisplayName: string;
}
