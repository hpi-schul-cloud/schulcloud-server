import { ApiProperty } from '@nestjs/swagger';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { CardElementResponse } from '@shared/domain';

export class TaskCardResponse {
	constructor({ id, draggable, cardElements, task }: TaskCardResponse) {
		this.id = id;
		this.draggable = draggable;
		this.cardElements = cardElements;
		this.task = task;
	}

	@ApiProperty({
		description: 'The id of the Card entity',
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
		description: 'The task details',
	})
	task: TaskResponse;
}
