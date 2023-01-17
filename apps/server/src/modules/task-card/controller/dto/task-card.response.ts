import { ApiProperty } from '@nestjs/swagger';
import { CardElementResponse } from '@shared/domain';
import { TaskResponse } from '@src/modules/task/controller/dto';

export class TaskCardResponse {
	constructor({ id, draggable, cardElements, task, completionDate }: TaskCardResponse) {
		this.id = id;
		this.draggable = draggable;
		this.cardElements = cardElements;
		this.task = task;
		this.completionDate = completionDate;
	}

	@ApiProperty({
		description: 'The id of the task card',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Array of card elements',
		type: [CardElementResponse],
	})
	cardElements: CardElementResponse[];

	@ApiProperty({
		description: 'Are the card elements draggable?',
	})
	draggable: boolean;

	@ApiProperty({
		description: 'The task attached to the card',
	})
	task: TaskResponse;

	@ApiProperty({
		description: 'Completion date of the task card',
	})
	completionDate?: Date;
}
