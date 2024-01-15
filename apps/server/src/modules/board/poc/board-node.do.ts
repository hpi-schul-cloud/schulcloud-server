import { DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { ROOT_PATH, PATH_SEPARATOR, joinPath } from './path-utils';

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	// type!: BoardNodeType;
	title?: string;
	children: BoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export class BoardNode extends DomainObject<BoardNodeProps> {
	get level(): number {
		return this.ancestorIds.length;
	}

	get children(): readonly BoardNode[] {
		// return this.props.children; // should we clone the array?
		return [...this.props.children] as const;
	}

	get parentId(): EntityId | undefined {
		const parentId = this.hasParent() ? this.ancestorIds[this.ancestorIds.length - 1] : undefined;
		return parentId;
	}

	hasParent() {
		return this.ancestorIds.length > 0;
	}

	get ancestorIds(): EntityId[] {
		const parentIds = this.props.path.split(PATH_SEPARATOR).filter((id) => id !== '');
		return parentIds;
	}

	get path(): string {
		return this.props.path;
	}

	addToParent(parent: BoardNode, position?: { index1: string; index2: string }): void {
		// TODO remove from potential previous parent (and its children)?
		if (this.parentId !== parent.id) {
			this.props.path = joinPath(parent.path, parent.id);
			// TODO set index (position)
			this.props.level = parent.level + 1;
		}
		if (!parent.children.includes(this)) {
			parent.addChild(this, position);
		}
	}

	removeFromParent(parent: BoardNode): void {
		if (this.parentId === parent.id) {
			this.props.path = ROOT_PATH;
			// TODO set index (position)
			this.props.level = 0;
		}
		if (parent.children.includes(this)) {
			parent.removeChild(this);
		}
	}

	addChild(child: BoardNode, position?: { index1: string; index2: string }): void {
		if (!this.children.includes(child)) {
			this.props.children.push(child);
			// TODO sort children
		}
		if (child.parentId !== this.id) {
			child.addToParent(this, position);
		}
	}

	removeChild(child: BoardNode): void {
		if (this.children.includes(child)) {
			const index = this.children.indexOf(child);
			this.props.children.splice(index, 1);
		}
		if (child.parentId === this.id) {
			child.removeFromParent(this);
		}
	}
}
