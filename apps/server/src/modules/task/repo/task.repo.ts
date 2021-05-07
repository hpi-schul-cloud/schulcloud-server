import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, LeanDocument, Model, Query, Types } from 'mongoose';
import { EntityId } from '../../../shared/domain/entity-id';
import { ITask, Task } from '../entity/task.entity';

@Injectable()
export class TaskRepo {
	constructor(@InjectModel('Task') private readonly taskModel: Model<ITask>) {}

	async findAllOpenByUser(userId: EntityId): Promise<Task[]> {
		const response = await this.taskModel.find({}).lean().exec();
		return response;
	}
}
