import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsNumber, Min } from 'class-validator';

export class BoardLessonResponse {
	constructor({ id, name, hidden, numberOfTasks, createdAt, updatedAt }: BoardLessonResponse) {
		this.id = id;
		this.name = name;
		this.hidden = hidden;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.numberOfTasks = numberOfTasks;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

	@IsNumber()
	@Min(0)
	@ApiProperty()
	numberOfTasks: number;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	hidden: boolean;
}
