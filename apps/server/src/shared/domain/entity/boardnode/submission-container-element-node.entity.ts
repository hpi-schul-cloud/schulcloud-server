import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.SUBMISSION_CONTAINER_ELEMENT })
export class SubmissionContainerElementNode extends BoardNode {
	@Property()
	dueDate: Date;

	constructor(props: TaskElementNodeProps) {
		super(props);
		this.type = BoardNodeType.SUBMISSION_CONTAINER_ELEMENT;
		this.dueDate = props.dueDate;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildSubmissionContainerElement(this);

		return domainObject;
	}
}

export interface TaskElementNodeProps extends BoardNodeProps {
	dueDate: Date;
}
