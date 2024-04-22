import { Embedded, Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BoardExternalReference } from '@shared/domain/domainobject';
import { BaseEntityWithTimestamps, BoardNodeType } from '@shared/domain/entity';
import { AnyBoardNode, ROOT_PATH } from '../../domain';
import { BoardNodeEntityProps } from '../types';
import { Context } from './embeddables';

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

	@Embedded(() => Context, { prefix: false, nullable: true })
	_context: BoardNodeEntityProps['context'];

	get context(): BoardExternalReference | undefined {
		return this._context;
	}

	// We have to make sure that the embedded object is an instance of the embeddable class.
	// Otherwise the property decorators of the embeddable wouldn't work.
	set context(context: BoardExternalReference | undefined) {
		if (context instanceof Context || context === undefined) {
			this._context = context;
		} else {
			this._context = new Context(context);
		}
	}
}
