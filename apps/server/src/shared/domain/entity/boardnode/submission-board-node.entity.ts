import { Entity, Index, Property } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';
// import { User } from '../user.entity';
// import {ObjectId} from "@mikro-orm/mongodb";

@Entity({ discriminatorValue: BoardNodeType.SUBMISSION_BOARD })
export class SubmissionBoardNode extends BoardNode {
	@Property()
	completed!: boolean;

	@Index()
	@Property({
		comment: 'The user whos submission this is. Usually the student submitting the work.',
	})
	userId!: EntityId;

	constructor(props: SubmissionBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.SUBMISSION_BOARD;
		this.completed = props.completed;
		this.userId = props.userId;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildSubmissionBoard(this);

		return domainObject;
	}
}

export interface SubmissionBoardNodeProps extends BoardNodeProps {
	completed: boolean;
	userId: EntityId;
}
