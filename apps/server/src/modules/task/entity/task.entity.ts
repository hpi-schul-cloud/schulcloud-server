import { Expose } from 'class-transformer';
import { WithTimeStampBaseEntity } from '../../../shared/core/repo';
import { Document } from 'mongoose';

export class Task extends WithTimeStampBaseEntity {
	constructor(partial: Partial<Task>) {
		super();
		Object.assign(this, partial);
	}

	@Expose()
	name: string;
	@Expose()
	duedate: Date;
	@Expose()
	courseName: string;
	@Expose()
	displayColor: string;
	@Expose()
	id: string;
}

type ITaskModel = {
	courseId: { name: string; color: string };
	dueDate: Date;
	name: string;
};

export type ITask = Document & ITaskModel & WithTimeStampBaseEntity;
