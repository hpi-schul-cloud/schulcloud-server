import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { Entity, Index, Property } from '@mikro-orm/core';
import { BoardNode, BoardNodeProps } from './board-node.do';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements BoardNodeProps {
	@Index()
	@Property({ nullable: false })
	path = ','; // TODO find better way to provide defaults!

	@Property({ nullable: false })
	level = 0;

	@Property({ nullable: false })
	position = 0;

	// @Index()
	// @Enum(() => BoardNodeType)
	// type!: BoardNodeType;

	@Property({ nullable: true })
	title?: string;

	@Property({ persist: false })
	children: BoardNode[] = [];
}
