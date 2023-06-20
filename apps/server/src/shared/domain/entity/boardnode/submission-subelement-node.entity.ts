import { Entity, Index, Property } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';
// import { User } from '../user.entity';
// import {ObjectId} from "@mikro-orm/mongodb";

@Entity({ discriminatorValue: BoardNodeType.SUBMISSION_SUBELEMENT })
export class SubmissionSubElementNode extends BoardNode {
	@Property()
	completed!: boolean;

	@Index()
	@Property()
	userId!: EntityId;

	constructor(props: SubmissionSubElementNodeProps) {
		super(props);
		this.type = BoardNodeType.SUBMISSION_SUBELEMENT;
		this.completed = props.completed;
		this.userId = props.userId;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildSubmissionSubElement(this);

		return domainObject;
	}
}

export interface SubmissionSubElementNodeProps extends BoardNodeProps {
	completed: boolean;
	userId: EntityId;
}
