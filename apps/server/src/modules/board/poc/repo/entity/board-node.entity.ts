import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { AnyBoardNode, AnyBoardNodeProps } from '../../domain';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements AnyBoardNodeProps {
	@Index()
	@Property({ nullable: false })
	path = ','; // TODO find better way to provide defaults!

	@Property({ nullable: false, type: 'integer' })
	level = 0;

	@Property({ nullable: false, type: 'integer' })
	position = 0;

	@Index()
	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	@Property({ nullable: true })
	title?: string;

	@Property({ persist: false })
	children: AnyBoardNode[] = [];

	@Property()
	height!: number;
}
