import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

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

	addChild(child: AnyBoardDo, position?: number): void {
		if (!this.isAllowedAsChild(child)) {
			throw new Error(`Cannot add child of type '${child.constructor.name}'`);
		}
		if (position === undefined || position >= this.children.length) {
			this.children.push(child);
		} else {
			this.children.splice(position, 0, child);
		}
	}

	abstract isAllowedAsChild(domainObject: AnyBoardDo): boolean;

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

	abstract accept(visitor: BoardCompositeVisitor): void;

	abstract acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void>;
}

export interface BoardCompositeProps {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;
}
