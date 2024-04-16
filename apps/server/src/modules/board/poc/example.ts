enum BoardNodeType {
	CARD = 'card',
	COLUMN = 'column',
}

interface BoardNodeProps {
	id: string;
	position: number;
	type: BoardNodeType;
}

interface CardProps extends BoardNodeProps {
	height: number;
	type: BoardNodeType.CARD;
}

interface ColumnProps extends BoardNodeProps {
	title: string;
	type: BoardNodeType.COLUMN;
}

// interface AllBoardNodeProps extends CardProps, ColumnProps {}
type AnyBoardNodeProps = CardProps | ColumnProps;

class BoardNodeEntity implements Omit<CardProps, 'type'>, Omit<ColumnProps, 'type'> {
	id!: string;

	position!: number;

	height!: number;

	title!: string;

	type!: BoardNodeType.CARD | BoardNodeType.COLUMN;
}

abstract class BoardNode<T extends AnyBoardNodeProps> {
	constructor(readonly props: T) {}

	abstract toString(): string;
}

class Card extends BoardNode<CardProps> {
	toString() {
		return `card with height: ${this.props.height}`;
	}
}

class Column extends BoardNode<ColumnProps> {
	toString() {
		return `column with title: ${this.props.title}`;
	}
}

// type AnyBoardNode = Card | Column;

// const props = new BoardNodeEntity();
// props.height = 42;
// props.title = "Column #1";
// props.type = BoardNodeType.COLUMN;

// const node = createBoardNode(props);
// console.log(node.toString());

const cardProps: AnyBoardNodeProps = {
	id: '42',
	type: BoardNodeType.CARD,
	position: 0,
	height: 200,
};

const card = new Card(cardProps);
console.log(card.toString());

const columnProps: AnyBoardNodeProps = {
	id: '44',
	type: BoardNodeType.COLUMN,
	position: 10,
	title: 'Column #2',
};

const column = new Column(columnProps);
console.log(column.toString());

// from database
const props = new BoardNodeEntity();
props.id = '42';
props.type = BoardNodeType.CARD;
props.position = 0;
props.height = 422;

const createNode = (entity: AnyBoardNodeProps) => {
	if (props.type === BoardNodeType.CARD) {
		return new Card(entity as CardProps);
	}
	if (props.type === BoardNodeType.COLUMN) {
		return new Column(entity as ColumnProps);
	}
	throw new Error();
};

const node = createNode(props);
console.log(node.toString());

// ----
// https://stackoverflow.com/questions/36871057/does-typescript-support-subset-types

// type Subset<T extends U, U> = U;

// ----

// boardNode.removeChild(child);
// repo.deleteRecursive(child);
// repo.flush();
