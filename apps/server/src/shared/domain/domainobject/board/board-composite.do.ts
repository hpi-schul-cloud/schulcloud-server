import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DomainObject } from '@shared/domain/domain-object'; // fix import if it is avaible
import { EntityId } from '@shared/domain/types';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export abstract class BoardComposite<T extends BoardCompositeProps> extends DomainObject<T> {
	get children(): AnyBoardDo[] {
		return this.props.children ?? [];
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	addChild(child: AnyBoardDo, position?: number): void {
		if (!this.isAllowedAsChild(child)) {
			throw new ForbiddenException(`Cannot add child of type '${child.constructor.name}'`);
		}
		position = position ?? this.children.length;
		if (position < 0 || position > this.children.length) {
			throw new BadRequestException(`Invalid child position '${position}'`);
		}
		if (this.hasChild(child)) {
			throw new BadRequestException(`Cannot add existing child id='${child.id}'`);
		}
		this.children.splice(position, 0, child);
	}

	abstract isAllowedAsChild(domainObject: AnyBoardDo): boolean;

	removeChild(child: AnyBoardDo): void {
		this.props.children = this.children.filter((ch) => ch.id !== child.id);
	}

	hasChild(child: AnyBoardDo): boolean {
		// TODO check by object identity instead of id
		const exists = this.children.some((obj) => obj.id === child.id);
		return exists;
	}

	getChildrenOfType<U extends AnyBoardDo>(type: new (...args: U[]) => U): U[] {
		const childrenOfType: U[] = [];
		for (const child of this.children) {
			if (child.children) {
				childrenOfType.push(...child.getChildrenOfType(type));
			}
			if (child instanceof type) {
				childrenOfType.push(child);
			}
		}

		return childrenOfType;
	}

	abstract accept(visitor: BoardCompositeVisitor): void;

	abstract acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void>;
}

export interface BoardCompositeProps {
	id: EntityId;
	children?: AnyBoardDo[];
	createdAt: Date;
	updatedAt: Date;
}
