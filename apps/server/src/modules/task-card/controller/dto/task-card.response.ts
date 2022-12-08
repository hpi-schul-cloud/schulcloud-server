import { ApiProperty } from '@nestjs/swagger';
import { CardElement } from '@shared/domain/entity/cardElement.entity';
import { TaskResponse } from '@src/modules/task/controller/dto';
import { CardElementResponse } from '@src/modules/task-card/controller/dto/card-element.response';

export class TaskCardResponse {
	constructor({ id, draggable, cardElements, task }: TaskCardResponse) {
		this.id = id;
		this.draggable = draggable;
		this.cardElements = cardElements;
		//this.description = description;
		//this.title = title;

		this.task = task;
	}

	@ApiProperty({
		description: 'The id of the Card entity',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Array of card elements',
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
