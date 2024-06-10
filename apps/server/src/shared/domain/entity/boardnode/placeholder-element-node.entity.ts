import { Entity, Enum, Property } from '@mikro-orm/core';
import { AnyBoardDo, ContentElementType } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.PLACEHOLDER })
export class PlaceholderElementNodeEntity extends BoardNode {
	@Property()
	previousElementDisplayName: string;

	@Enum(() => ContentElementType)
	previousElementType: ContentElementType;

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
	previousElementType: ContentElementType;
	previousElementDisplayName: string;
}
