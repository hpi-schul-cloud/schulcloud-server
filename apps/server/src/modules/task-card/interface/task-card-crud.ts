import { RichText } from '@shared/domain/types';

export interface ITaskCardCRUD {
	id?: string;
	courseId?: string;
	title: string;
	text?: RichText[];
	visibleAtDate?: Date;
	dueDate?: Date;
	assignedUsers?: string[];
}
