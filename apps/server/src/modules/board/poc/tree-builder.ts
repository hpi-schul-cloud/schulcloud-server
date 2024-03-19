import { BoardNode, BoardNodeProps } from './board-node.do';
import { joinPath } from './path-utils';

export class TreeBuilder {
	private childrenMap: Record<string, BoardNodeProps[]> = {};

	constructor(descendants: BoardNodeProps[] = []) {
		for (const props of descendants) {
			this.childrenMap[props.path] ||= [];
			this.childrenMap[props.path].push(props);
		}
	}

	build(props: BoardNodeProps): BoardNode {
		props.children = this.getChildren(props).map((childProps) => this.build(childProps));

		const boardNode = new BoardNode(props);

		return boardNode;
	}

	private getChildren(props: BoardNodeProps): BoardNodeProps[] {
		const pathOfChildren = joinPath(props.path, props.id);
		const children = this.childrenMap[pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}
}
