import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { joinPath, PATH_SEPARATOR, ROOT_PATH } from './path-utils';
import type { AnyBoardNode, BoardNodeProps } from './types';

export abstract class BoardNode<T extends BoardNodeProps> extends DomainObject<T> {
	constructor(props: T) {
		super(props);
		props.children.forEach((child, pos) => {
			child.updatePath(this);
			child.updatePosition(pos);
		});
	}

	get level(): number {
		return this.ancestorIds.length;
	}

	get children(): readonly AnyBoardNode[] {
		return this.props.children;
	}

	get parentId(): EntityId | undefined {
		const parentId = this.hasParent() ? this.ancestorIds[this.ancestorIds.length - 1] : undefined;
		return parentId;
	}

	hasParent() {
		return this.ancestorIds.length > 0;
	}

	get ancestorIds(): readonly EntityId[] {
		const parentIds = this.props.path.split(PATH_SEPARATOR).filter((id) => id !== '');
		return parentIds;
	}

	isRoot() {
		return this.ancestorIds.length === 0;
	}

	get rootId(): EntityId {
		return this.isRoot() ? this.id : this.ancestorIds[0];
	}

	get path(): string {
		return this.props.path;
	}

	get position(): number {
		return this.props.position;
	}

	addChild(child: AnyBoardNode, position?: number): void {
		if (!this.canHaveChild(child)) {
			throw new ForbiddenException(`Cannot add child of type '${child.constructor.name}'`);
		}

		const { children } = this.props;

		position = position ?? children.length;
		if (position < 0 || position > children.length) {
			throw new BadRequestException(`Invalid child position '${position}'`);
		}
		if (this.hasChild(child)) {
			throw new BadRequestException(`Cannot add existing child id='${child.id}'`);
		}
		children.splice(position, 0, child);

		child.updatePath(this);
		this.props.children.forEach((c, pos) => c.updatePosition(pos));
	}

	hasChild(child: AnyBoardNode): boolean {
		const exists = this.children.includes(child);
		return exists;
	}

	abstract canHaveChild(childNode: AnyBoardNode): boolean;

	removeChild(child: AnyBoardNode): void {
		this.props.children = this.children.filter((ch) => ch.id !== child.id);
		this.props.children.forEach((c, pos) => c.updatePosition(pos));
		child.resetPath();
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.createdAt;
	}

	private updatePath(parent: BoardNode<BoardNodeProps>): void {
		this.props.path = joinPath(parent.path, parent.id);
		this.props.level = parent.level + 1;
		this.props.children.forEach((child) => {
			child.updatePath(this);
		});
	}

	private resetPath(): void {
		this.props.path = ROOT_PATH;
		this.props.level = 0;
		this.props.children.forEach((child) => {
			child.resetPath();
		});
	}

	private updatePosition(position: number): void {
		this.props.position = position;
	}
}
