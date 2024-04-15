import { BoardNodeType } from '@shared/domain/entity';
import {
	AnyBoardNode,
	AnyBoardNodeProps,
	Card,
	CardProps,
	joinPath,
	RichTextElement,
	RichTextElementProps,
} from '../domain';

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

		let boardNode: AnyBoardNode;
		switch (props.type) {
			case BoardNodeType.CARD:
				boardNode = new Card(props as CardProps);
				break;
			case BoardNodeType.RICH_TEXT_ELEMENT:
				boardNode = new RichTextElement(props as RichTextElementProps);
				break;
			default:
				throw new Error(`Unknown BoardNodeType: ${props.type}`);
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
