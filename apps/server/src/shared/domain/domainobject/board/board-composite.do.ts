import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export abstract class BoardComposite<T extends BoardCompositeProps> {
	protected props: T;

	constructor(props: T) {
		this.props = {
			...props,
		};
	}

	get id(): EntityId {
		return this.props.id;
	}

	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	get children(): AnyBoardDo[] {
		return this.props.children;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	addChild(child: AnyBoardDo, position?: number): void {
		if (!this.isAllowedAsChild(child)) {
			throw new Error(`Cannot add child of type '${child.constructor.name}'`);
		}
		position = position ?? this.children.length;
		if (position < 0 || position > this.children.length) {
			throw new Error(`Invalid child position '${position}'`);
		}
		if (this.hasChild(child)) {
			throw new Error(`Cannot add existing child id='${child.id}'`);
		}
		this.children.splice(position, 0, child);
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

		this.props.children = this.children.filter((ch) => ch.id !== childId);
		return removedChild;
	}

	hasChild(child: AnyBoardDo): boolean {
		// TODO check by object identity instead of id
		const exists = this.children.some((obj) => obj.id === child.id);
		return exists;
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
