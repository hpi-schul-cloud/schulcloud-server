import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponseDto {
	constructor(partial: Partial<TaskResponseDto>) {
		Object.assign(this, partial);
	}

	@ApiProperty()
	title: string;
}
