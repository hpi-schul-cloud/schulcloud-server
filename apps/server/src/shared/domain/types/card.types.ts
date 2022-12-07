import { CardElement } from '@shared/domain/entity/cardElement.entity';
import type { Task } from '@shared/domain';

export interface ITaskCardCreate {
	title: string;
	description?: string[];
}

export interface ICardProprieties {
	draggable?: boolean;

	cardElements: CardElement[];
}

export interface ITaskCardProprieties extends ICardProprieties {
	task: Task;
}
