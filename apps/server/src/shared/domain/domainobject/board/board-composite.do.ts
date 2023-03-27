import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import type { AnyBoardDo } from './types';

export class BoardComposite {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: AnyBoardDoProps) {
		this.id = props.id;
		this.title = props.title;
		this.children = props.children;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	protected addChild(domainObject: AnyBoardDo, toIndex?: number) {
		if (toIndex) {
			this.children.splice(toIndex, 0, domainObject);
		} else {
			this.children.push(domainObject);
		}
	}

	removeChild(childId: EntityId): AnyBoardDo {
		if (this.children === undefined) {
			throw new NotFoundException('parent has no children');
		}

		const removedChild = this.children.find((child) => child.id === childId);
		if (removedChild === undefined) {
			throw new NotFoundException('child is not child of this parent');
		}

		this.children = this.children.filter((child) => child.id !== childId);
		return removedChild;
	}
}

export interface AnyBoardDoProps {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;
}
