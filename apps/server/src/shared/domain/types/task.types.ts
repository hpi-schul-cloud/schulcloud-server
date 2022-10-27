export interface ITaskUpdate {
	name: string;
	courseId?: string;
	lessonId?: string;
	description?: string;
	availableDate?: Date;
	dueDate?: Date;
}
