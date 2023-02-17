import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class BoardLessonResponse {
	constructor({
		id,
		name,
		hidden,
		numberOfPublishedTasks,
		numberOfDraftTasks,
		numberOfPlannedTasks,
		createdAt,
		updatedAt,
	}: BoardLessonResponse) {
		this.id = id;
		this.name = name;
		this.hidden = hidden;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.numberOfPublishedTasks = numberOfPublishedTasks;
		this.numberOfDraftTasks = numberOfDraftTasks;
		this.numberOfPlannedTasks = numberOfPlannedTasks;
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
	numberOfPublishedTasks: number;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiProperty()
	numberOfDraftTasks?: number;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiProperty()
	numberOfPlannedTasks?: number;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	hidden: boolean;
}
