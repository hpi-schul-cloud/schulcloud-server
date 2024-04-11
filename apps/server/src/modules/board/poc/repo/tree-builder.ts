import { AnyBoardNode, AnyBoardNodeProps, Card, joinPath } from '../domain';

// TODO handle different types of props and Domain Objects
// discriminator: props.type

export class TreeBuilder {
	private childrenMap: Record<string, AnyBoardNodeProps[]> = {};

	constructor(descendants: AnyBoardNodeProps[] = []) {
		for (const props of descendants) {
			this.childrenMap[props.path] ||= [];
			this.childrenMap[props.path].push(props);
		}
	}

	build(props: AnyBoardNodeProps): AnyBoardNode {
		props.children = this.getChildren(props).map((childProps) => this.build(childProps));

		const boardNode = new Card(props);

		return boardNode;
	}

	private getChildren(props: AnyBoardNodeProps): AnyBoardNodeProps[] {
		const pathOfChildren = joinPath(props.path, props.id);
		const children = this.childrenMap[pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}
}
