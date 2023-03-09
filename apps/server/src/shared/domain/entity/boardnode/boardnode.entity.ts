import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain/domainobject';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import type { BoardDoBuilder } from './board-do.builder';
import { BoardNodeType } from './types/board-node-type';

const PATH_SEPARATOR = ',';

@Entity({ tableName: 'boardnodes', discriminatorColumn: 'type' })
export abstract class BoardNode extends BaseEntityWithTimestamps {
	constructor(props: BoardNodeProps) {
		super();
		if (props.parent && props.parent.id == null) {
			throw new InternalServerErrorException('Cannot create board node with a parent having no id');
		}
		this.path = props.parent ? BoardNode.joinPath(props.parent.path, props.parent.id) : PATH_SEPARATOR;
		this.level = props.parent ? props.parent.level + 1 : 0;
		this.position = props.position ?? 0;
	}

	@Index()
	@Property({ nullable: false })
	path: string;

	@Property({ nullable: false })
	level: number;

	@Property({ nullable: false })
	position: number;

	@Index()
	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	get parentId(): EntityId | undefined {
		const parentId = this.hasParent() ? this.ancestorIds[this.ancestorIds.length - 1] : undefined;
		return parentId;
	}

	get ancestorIds(): EntityId[] {
		const parentIds = this.path.split(PATH_SEPARATOR).filter((id) => id !== '');
		return parentIds;
	}

	get pathOfChildren(): string {
		return BoardNode.joinPath(this.path, this.id);
	}

	hasParent() {
		return this.ancestorIds.length > 0;
	}

	abstract useDoBuilder(builder: BoardDoBuilder): AnyBoardDo;

	static joinPath(path: string, id: EntityId) {
		return `${path}${id}${PATH_SEPARATOR}`;
	}
}

export interface BoardNodeProps {
	parent?: BoardNode;
	position?: number;
}
