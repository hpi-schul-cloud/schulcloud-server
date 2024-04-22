import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType } from '@shared/domain/entity';
import { Card } from './card.do';
import { ColumnBoard } from './colum-board.do';
import { Column } from './column.do';
import { ROOT_PATH } from './path-utils';
import type { AnyBoardNodeProps, BoardNodeProps, CardProps, ColumnBoardProps, ColumnProps } from './types';

// This is an exploration how we can build a general board node factory function
// just for inspiration

type AnyBoardNodeType = `${BoardNodeType}`;
type BoardNodeTypeToClass<T extends AnyBoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
	? ColumnBoard
	: T extends BoardNodeType.COLUMN
	? Column
	: T extends BoardNodeType.CARD
	? Card
	: never;

type BaseProps<T extends AnyBoardNodeProps> = Pick<T, keyof BoardNodeProps>;
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type ExtraProps<T extends AnyBoardNodeProps> = StrictOmit<T, keyof BaseProps<T> | 'type'>;

type InitProps<T extends AnyBoardNodeProps> = Partial<BaseProps<T>> & ExtraProps<T>;
// type InitProps<T extends AnyBoardNodeProps> = Partial<T>;

type BoardNodeTypeToInitProps<T extends AnyBoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
	? InitProps<ColumnBoardProps>
	: T extends BoardNodeType.COLUMN
	? InitProps<ColumnProps>
	: T extends BoardNodeType.CARD
	? InitProps<CardProps>
	: never;

const createBoardNode = <T extends AnyBoardNodeType>(
	type: T,
	props: BoardNodeTypeToInitProps<T>
): BoardNodeTypeToClass<T> => {
	const baseProps = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: type as BoardNodeType,
	};

	let node: AnyBoardNode;

	switch (type) {
		case BoardNodeType.COLUMN_BOARD:
			node = new ColumnBoard({
				...baseProps,
				title: (props as ColumnBoardProps).title,
				isVisible: (props as ColumnBoardProps).isVisible,
				...props,
				type: BoardNodeType.COLUMN_BOARD,
			});
			break;
		case BoardNodeType.COLUMN:
			node = new Column({
				...baseProps,
				...props,
				type: BoardNodeType.COLUMN,
			});
			break;
		case BoardNodeType.CARD:
			node = new Card({
				...baseProps,
				height: (props as CardProps).height,
				...props,
				type: BoardNodeType.CARD,
			});
			break;
		default:
			throw Error(`Unknown type '${type}'`);
	}

	return node as BoardNodeTypeToClass<T>;
};

const createCard = (props: InitProps<CardProps>) => {
	const card = new Card({
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.CARD,
		...props,
		// height: props.height ?? 0,
	});
	return card;
};

const board = createBoardNode(BoardNodeType.COLUMN_BOARD, {
	title: '',
	isVisible: false,
});

const column = createBoardNode(BoardNodeType.COLUMN, {});

// const card = createBoardNode(BoardNodeType.CARD, {
// 	height: 0,
// });

const card = createCard({
	height: 0,
});

column.addChild(card);
board.addChild(column);
column.addChild(card);
