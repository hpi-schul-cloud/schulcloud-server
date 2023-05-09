import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.FILE_ELEMENT })
export class FileElementNode extends BoardNode {
	@Property()
	caption: string;

	constructor(props: FileElementNodeProps) {
		super(props);
		this.type = BoardNodeType.FILE_ELEMENT;
		this.caption = props.caption;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildFileElement(this);

		return domainObject;
	}
}

export interface FileElementNodeProps extends BoardNodeProps {
	caption: string;
}
