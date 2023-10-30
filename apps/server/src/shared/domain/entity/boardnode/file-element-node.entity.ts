import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.FILE_ELEMENT })
export class FileElementNode extends BoardNode {
	@Property()
	caption: string;

	@Property()
	alternativeText: string;

	constructor(props: FileElementNodeProps) {
		super(props);
		this.type = BoardNodeType.FILE_ELEMENT;
		this.caption = props.caption;
		this.alternativeText = props.alternativeText;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildFileElement(this);

		return domainObject;
	}
}

export interface FileElementNodeProps extends BoardNodeProps {
	caption: string;
	alternativeText: string;
}
