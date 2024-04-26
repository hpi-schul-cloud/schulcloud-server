import { AnyBoardNode, joinPath } from '../domain';
import { BoardNodeEntity } from './entity';
import { buildBoardNodeFromEntity } from './types';

export class TreeBuilder {
	private childrenMap: Record<string, BoardNodeEntity[]> = {};

	constructor(descendants: BoardNodeEntity[] = []) {
		for (const props of descendants) {
			this.childrenMap[props.path] ||= [];
			this.childrenMap[props.path].push(props);
		}
	}

	build(entity: BoardNodeEntity): AnyBoardNode {
		entity.children = this.getChildren(entity).map((childProps) => this.build(childProps));

		const boardNode = buildBoardNodeFromEntity(entity);

		return boardNode;
	}

	private getChildren(entity: BoardNodeEntity): BoardNodeEntity[] {
		const pathOfChildren = joinPath(entity.path, entity.id);
		const children = this.childrenMap[pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}
}
