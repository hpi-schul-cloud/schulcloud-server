import { BoardNodeType } from '@shared/domain/entity';
import { EntityId, InputFormat } from '@shared/domain/types';
import type { Card, RichTextElement } from '.';

export type AnyBoardNode = Card | RichTextElement; // union type. add more types

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	type: BoardNodeType;
	title?: string;
	children: AnyBoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CardProps extends BoardNodeProps {
	height: number;
}

export interface RichTextElementProps extends BoardNodeProps {
	text: string;
	inputFormat: InputFormat;
}

export type AnyBoardNodeProps = CardProps | RichTextElementProps;
export type AllBoardNodeProps = CardProps & RichTextElementProps;
