import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { AnyBoardDo } from '../../domainobject';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

const PATH_SEPARATOR = ',';

@Entity({ tableName: 'boardnodes', discriminatorColumn: 'type', abstract: true })
@Index({ properties: ['path'] })
export abstract class BoardNode extends BaseEntityWithTimestamps {
	constructor(props: BoardNodeProps) {
		super();
		if (props.parent && props.parent.id == null) {
			throw new InternalServerErrorException('Cannot create board node with a parent having no id');
		}
		if (props.id != null) {
			this.id = props.id;
		}
		this.path = props.parent ? BoardNode.joinPath(props.parent.path, props.parent.id) : PATH_SEPARATOR;
		this.level = props.parent ? props.parent.level + 1 : 0;
		this.position = props.position ?? 0;
		this.title = props.title;
	}

	@Property({ nullable: false })
	path: string;

	@Property({ nullable: false })
	level: number;

	@Property({ nullable: false })
	position: number;

	@Enum(() => BoardNodeType)
	type!: BoardNodeType;

	@Property({ nullable: true })
	title?: string;

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
	id?: EntityId;
	parent?: BoardNode;
	position?: number;
	title?: string;
}
