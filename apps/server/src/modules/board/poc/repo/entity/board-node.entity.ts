import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { AnyBoardNode, ROOT_PATH } from '../../domain';
import { BoardNodeEntityProps } from '../types';

@Entity({ tableName: 'boardnodes' })
export class BoardNodeEntity extends BaseEntityWithTimestamps implements BoardNodeEntityProps {
	@Index()
	@Property({ nullable: false })
	path = ROOT_PATH;

	@Property({ nullable: false, type: 'integer' })
	level = 0;

	@Property({ nullable: false, type: 'integer' })
	position = 0;

	@Index()
	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	@Property({ persist: false })
	children: AnyBoardNode[] = [];

	@Property({ type: 'boolean', nullable: true })
	isVisible: boolean | undefined;

	@Property({ nullable: true })
	title: string | undefined;

	@Property({ type: 'integer', nullable: true })
	height: number | undefined;
}
