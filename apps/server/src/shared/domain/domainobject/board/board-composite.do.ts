import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import type { AnyBoardDo } from './types';

export abstract class BoardComposite {
	id: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: BoardCompositeProps) {
		this.id = props.id ?? new ObjectId().toHexString();
		this.title = props.title;
		this.children = props.children;
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();
	}

	addChild(child: AnyBoardDo, position?: number): void {
		if (!this.isAllowedAsChild(child)) {
			throw new ForbiddenException(`Cannot add child of type '${child.constructor.name}'`);
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
}

export interface BoardCompositeProps {
	id?: EntityId;

	title?: string;

	children: AnyBoardDo[];

	createdAt?: Date;

	updatedAt?: Date;
}
