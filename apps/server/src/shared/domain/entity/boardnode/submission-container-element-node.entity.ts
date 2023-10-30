import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.SUBMISSION_CONTAINER_ELEMENT })
export class SubmissionContainerElementNode extends BoardNode {
	@Property({ nullable: true })
	dueDate: Date | null;

	constructor(props: SubmissionContainerNodeProps) {
		super(props);
		this.type = BoardNodeType.SUBMISSION_CONTAINER_ELEMENT;
		this.dueDate = props.dueDate;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildSubmissionContainerElement(this);

		return domainObject;
	}
}

export interface SubmissionContainerNodeProps extends BoardNodeProps {
	dueDate: Date | null;
}
