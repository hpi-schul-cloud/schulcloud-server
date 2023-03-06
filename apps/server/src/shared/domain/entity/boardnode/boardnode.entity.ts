import { Embedded, Entity, Property } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import { BoardNodeType, CardPayload, ColumnBoardPayload, ColumnPayload, TextElementPayload } from './payload';

const PATH_SEPARATOR = ',';

export const BOARD_NODE_PAYLOAD_CLASSES = [ColumnBoardPayload, ColumnPayload, CardPayload, TextElementPayload];

export type AnyBoardNodePayload = ColumnBoardPayload | ColumnPayload | CardPayload | TextElementPayload;

export interface BoardNodeProperties {
	parent?: BoardNode;
	position?: number;
	payload: AnyBoardNodePayload;
}

@Entity({ tableName: 'boardnodes' })
export class BoardNode extends BaseEntityWithTimestamps {
	constructor(props: BoardNodeProperties) {
		super();
		if (props.parent && props.parent.id == null) {
			throw new InternalServerErrorException('Cannot create board node with a parent having no id');
		}
		this.path = props.parent ? BoardNode.joinPath(props.parent.path, props.parent.id) : PATH_SEPARATOR;
		this.level = props.parent ? props.parent.level + 1 : 0;
		this.position = props.position ?? 0;
		this.payload = props.payload;
	}

	@Property({ nullable: false })
	path: string;

	@Property({ nullable: false })
	level: number;

	@Property({ nullable: false })
	position: number;

	// we use polymorphic embeddables without prefix here
	// see: https://mikro-orm.io/docs/embeddables#polymorphic-embeddables
	@Embedded(() => BOARD_NODE_PAYLOAD_CLASSES, { prefix: false })
	payload: AnyBoardNodePayload;

	get type(): BoardNodeType {
		return this.payload.type;
	}

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

	static joinPath(path: string, id: EntityId) {
		return `${path}${id}${PATH_SEPARATOR}`;
	}
}
