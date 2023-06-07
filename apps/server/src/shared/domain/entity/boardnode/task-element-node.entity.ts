import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.TASK_ELEMENT })
export class TaskElementNode extends BoardNode {
	@Property()
	dueDate: Date;

	constructor(props: TaskElementNodeProps) {
		super(props);
		this.type = BoardNodeType.TASK_ELEMENT;
		this.dueDate = props.dueDate;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildTaskElement(this);

		return domainObject;
	}
}

export interface TaskElementNodeProps extends BoardNodeProps {
	dueDate: Date;
}
