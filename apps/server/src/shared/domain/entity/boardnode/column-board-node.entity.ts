import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo, BoardExternalReferenceType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types';
import { BoardNodeType } from './types/board-node-type';

@Embeddable()
export class ContextReference {
	@Property()
	type!: BoardExternalReferenceType;

	@Property()
	id!: EntityId;
}

@Entity({ discriminatorValue: BoardNodeType.COLUMN_BOARD })
export class ColumnBoardNode extends BoardNode {
	constructor(props: ColumnBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.COLUMN_BOARD;

		this.context = props.context;
	}

	@Embedded(() => ContextReference, { object: true, nullable: false, prefix: true })
	context: ContextReference;

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildColumnBoard(this);
		return domainObject;
	}
}

export interface ColumnBoardNodeProps extends BoardNodeProps {
	context: ContextReference;
}
