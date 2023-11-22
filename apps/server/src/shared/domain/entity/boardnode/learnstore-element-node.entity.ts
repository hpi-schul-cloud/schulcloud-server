import { Entity, ManyToOne } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.LEARNSTORE })
export class LearnstoreElementNodeEntity extends BoardNode {
	@ManyToOne({ nullable: true })
	someId?: string;

	constructor(props: LearnstoreElementNodeEntityProps) {
		super(props);
		this.type = BoardNodeType.LEARNSTORE;
		this.someId = props.someId;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildLearnstoreElement(this);
		return domainObject;
	}
}

export interface LearnstoreElementNodeEntityProps extends BoardNodeProps {
	someId?: string;
}
