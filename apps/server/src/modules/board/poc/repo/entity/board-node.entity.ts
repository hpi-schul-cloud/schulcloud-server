import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { EntityId, InputFormat } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { AnyBoardNode, AllBoardNodeProps } from '../../domain';

const PATH_SEPARATOR = ',';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements Partial<AllBoardNodeProps> {
	@Index()
	@Property({ nullable: false })
	path = PATH_SEPARATOR; // TODO find better way to provide defaults!

	@Property({ nullable: false, type: 'integer' })
	level = 0;

	@Property({ nullable: false, type: 'integer' })
	position = 0;

	@Index()
	@Enum(() => BoardNodeType)
	type: BoardNodeType = BoardNodeType.CARD;

	@Property({ persist: false })
	children: AnyBoardNode[] = [];

	@Property({ nullable: true })
	title?: string;

	/* ColumnBoardNode props */
	@Property({ nullable: true, fieldName: 'contextType' })
	_contextType?: BoardExternalReferenceType;

	@Property({ nullable: false, fieldName: 'contextType' })
	_contextId?: ObjectId;

	@Property({ type: 'boolean', nullable: false })
	isVisible = false;

	/* Card props */
	@Property({ nullable: true })
	height?: number;

	/* RichTextElement props */
	@Property({ nullable: true })
	text?: string;

	@Property({ nullable: true })
	inputFormat?: InputFormat;

	/* ExternalToolElement props */
	// TODO migration and only store ids not the whole entity
	@Property({ nullable: true, fieldName: 'contextExternalToolId' })
	contextExternalToolId?: ObjectId;

	get ancestorIds(): EntityId[] {
		const parentIds = this.path.split(PATH_SEPARATOR).filter((id) => id !== '');
		return parentIds;
	}
}
