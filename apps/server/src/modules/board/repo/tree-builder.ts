import { AnyBoardNode, getBoardNodeConstructor, joinPath } from '../domain';
import { BoardNodeEntity } from './entity';

export class TreeBuilder {
	private childrenMap: Record<string, BoardNodeEntity[]> = {};

	constructor(descendants: BoardNodeEntity[] = []) {
		for (const props of descendants) {
			this.childrenMap[props.path] ||= [];
			this.childrenMap[props.path].push(props);
		}
	}

	build(entity: BoardNodeEntity): AnyBoardNode {
		const children = this.getChildren(entity).map((childProps) => this.build(childProps));

		// Assign children only when not present.
		// This prevents already loaded children from being overwritten
		// when building a tree with a smaller depth.
		if (!entity.children || entity.children.length === 0) {
			entity.children = children;
		}

		// check identity map reference
		if (entity.domainObject) {
			return entity.domainObject;
		}

		const Constructor = getBoardNodeConstructor(entity.type);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const boardNode = new Constructor(entity);
		// attach to identity map
		entity.domainObject = boardNode;

		return boardNode;
	}

	private getChildren(entity: BoardNodeEntity): BoardNodeEntity[] {
		const pathOfChildren = joinPath(entity.path, entity.id);
		const children = this.childrenMap[pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}
}
