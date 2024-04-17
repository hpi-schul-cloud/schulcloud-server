import { AnyBoardNode, AnyBoardNodeProps, Card, ColumnBoard, joinPath } from '../domain';
import { isCardProps, isColumnBoardProps } from './type-guards';

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

		let boardNode: AnyBoardNode;

		if (isColumnBoardProps(props)) {
			boardNode = new ColumnBoard(props);
		} else if (isCardProps(props)) {
			boardNode = new Card(props);
		} else {
			throw Error(`Invalid board node type: '${(props as { type: string }).type}'`);
		}

		return boardNode;
	}

	private getChildren(props: AnyBoardNodeProps): AnyBoardNodeProps[] {
		const pathOfChildren = joinPath(props.path, props.id);
		const children = this.childrenMap[pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}
}
