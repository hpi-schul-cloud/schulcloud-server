import { RichText } from '@shared/domain/types';

export interface ITaskCardCRUD {
	id?: string;
	title: string;
	text?: RichText[];
	visibleAtDate?: Date;
	dueDate?: Date;
}
