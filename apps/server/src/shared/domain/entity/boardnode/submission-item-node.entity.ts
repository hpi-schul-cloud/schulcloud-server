import { Entity, Property } from '@mikro-orm/core';
import { EntityId } from '@shared/domain/types';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.SUBMISSION_ITEM })
export class SubmissionItemNode extends BoardNode {
	@Property()
	completed!: boolean;

	// @Index() // TODO if enabled tests in management fails with ERROR [ExceptionsHandler] Failed to create indexes
	@Property({
		comment: 'The user whos submission this is. Usually the student submitting the work.',
	})
	userId!: EntityId;

	constructor(props: SubmissionItemNodeProps) {
		super(props);
		this.type = BoardNodeType.SUBMISSION_ITEM;
		this.completed = props.completed;
		this.userId = props.userId;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildSubmissionItem(this);

		return domainObject;
	}
}

export interface SubmissionItemNodeProps extends BoardNodeProps {
	completed: boolean;
	userId: EntityId;
}
