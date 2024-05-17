import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
} from '@modules/board/domain/types/board-external-reference';
import { BoardLayout } from '@modules/board/domain/types/board-layout.enum';
import { LearnroomElement } from '../interface';
import { BaseEntityWithTimestamps } from './base.entity';

// TODO comment
/**
 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
 */
@Entity({ tableName: 'boardnodes' })
export class ColumnBoardNode extends BaseEntityWithTimestamps implements LearnroomElement {
	constructor(props: ColumnBoardNodeProps) {
		super();
		this.title = props.title;
		this.isVisible = props.isVisible;
		this.layout = props.layout;
		this.contextType = props.context.type;
		this.contextId = new ObjectId(props.context.id);
	}

	@Property({ nullable: false })
	title!: string;

	@Property({ type: 'boolean', nullable: false })
	isVisible!: boolean;

	@Property({ nullable: false })
	layout!: BoardLayout;

	@Property({ fieldName: 'contextType' })
	contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	contextId: ObjectId;

	/**
	 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
	 */
	publish(): void {
		this.isVisible = true;
	}

	/**
	 * @deprecated - this is here only for the sake of the legacy-board (lernraum)
	 */
	unpublish(): void {
		this.isVisible = false;
	}
}

export interface ColumnBoardNodeProps {
	title: string;
	isVisible: boolean;
	layout: BoardLayout;
	context: BoardExternalReference;
}
