import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import type { AnyBoardDo } from './types';

export abstract class BoardComposite {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: BoardCompositeProps) {
		this.id = props.id;
		this.title = props.title;
		this.children = props.children;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	protected _addChild(domainObject: AnyBoardDo, position?: number): void {
		if (position !== undefined) {
			this.children.splice(position, 0, domainObject);
		} else {
			this.children.push(domainObject);
		}
	}

	abstract addChild(domainObject: AnyBoardDo, position?: number): void;

	getChild(childId: EntityId): AnyBoardDo {
		const foundChild = this.children.find((child) => child.id === childId);
		if (foundChild === undefined) {
			throw new NotFoundException('child is not child of this parent');
		}

		return foundChild;
	}

	removeChild(childId: EntityId): AnyBoardDo {
		const removedChild = this.getChild(childId);

		this.children = this.children.filter((ch) => ch.id !== childId);
		return removedChild;
	}
}

export interface BoardCompositeProps {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;
}
