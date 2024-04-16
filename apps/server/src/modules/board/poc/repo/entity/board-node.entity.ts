import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { InputFormat } from '@shared/domain/types';
import { AnyBoardNode, AllBoardNodeProps } from '../../domain';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements Partial<AllBoardNodeProps> {
	@Index()
	@Property({ nullable: false })
	path = ','; // TODO find better way to provide defaults!

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

	/* Card props */
	@Property({ nullable: true })
	height?: number;

	/* RichTextElement props */
	@Property({ nullable: true })
	text?: string;

	@Property({ nullable: true })
	inputFormat?: InputFormat;
}
