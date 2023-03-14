import { EntityId } from '@shared/domain/types';
import { TextElement } from './text-element.do';

export class Card implements CardProps {
	id: EntityId;

	title: string;

	height: number;

	elements: TextElement[]; // TODO: AnyContentElement

	createdAt: Date;

	updatedAt: Date;

	constructor(props: CardProps) {
		this.id = props.id;
		this.title = props.title;
		this.height = props.height;
		this.elements = props.elements;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}
}

interface CardProps {
	id: EntityId;

	title: string;

	height: number;

	elements: TextElement[]; // TODO: AnyContentElement

	createdAt: Date;

	updatedAt: Date;
}
