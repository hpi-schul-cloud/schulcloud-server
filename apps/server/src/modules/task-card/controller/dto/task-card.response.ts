import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { CardElementResponse } from '@shared/domain';
import { TaskResponse } from '@src/modules/task/controller/dto';

export class TaskCardResponse {
	constructor({ id, draggable, cardElements, task, visibleAtDate, dueDate }: TaskCardResponse) {
		this.id = id;
		this.draggable = draggable;
		this.cardElements = cardElements;
		this.task = task;
		this.visibleAtDate = visibleAtDate;
		this.dueDate = dueDate;
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

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

	@ApiPropertyOptional()
	courseId?: string;

	@ApiProperty({
		description: 'Are the card elements draggable?',
	})
	draggable: boolean;

	@ApiProperty({
		description: 'The task attached to the card',
	})
	task: TaskResponse;

	@ApiProperty({
		description: 'Visible at date of the task card',
	})
	visibleAtDate: Date;

	@ApiProperty({
		description: 'Due date of the task card',
	})
	dueDate: Date;
}
