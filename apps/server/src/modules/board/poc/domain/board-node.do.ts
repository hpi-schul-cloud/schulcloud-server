import { BadRequestException } from '@nestjs/common';
import { DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { joinPath, PATH_SEPARATOR, ROOT_PATH } from './path-utils';
import { AnyBoardNode, BoardNodeProps } from './types';

export abstract class BoardNode<T extends BoardNodeProps> extends DomainObject<T> {
	constructor(props: T) {
		super(props);
		props.children.forEach((child) => child.updatePath(this));
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

	get path(): string {
		return this.props.path;
	}

	addChild(child: AnyBoardNode, position?: number): void {
		const { children } = this.props;
		// TODO check isAllowedAsChild
		position = position ?? children.length;
		if (position < 0 || position > children.length) {
			throw new BadRequestException(`Invalid child position '${position}'`);
		}
		if (this.hasChild(child)) {
			throw new BadRequestException(`Cannot add existing child id='${child.id}'`);
		}
		children.splice(position, 0, child);

		child.updatePath(this);
	}

	hasChild(child: AnyBoardNode): boolean {
		// TODO check by object identity instead of id
		// requires identity map for domain objects
		const exists = this.children.some((obj) => obj.id === child.id);
		return exists;
	}

	abstract isAllowedAsChild(boardNode: AnyBoardNode): boolean;

	removeChild(child: AnyBoardNode): void {
		this.props.children = this.children.filter((ch) => ch.id !== child.id);
		child.resetPath();
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
}
