import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.FILE_ELEMENT })
export class FileElementNode extends BoardNode {
	@Property()
	description: string;

	constructor(props: FileElementNodeProps) {
		super(props);
		this.type = BoardNodeType.FILE_ELEMENT;
		this.description = props.description;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildFileElement(this);
		return domainObject;
	}
}

export interface FileElementNodeProps extends BoardNodeProps {
	description: string;
}
