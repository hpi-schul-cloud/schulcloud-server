import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CourseExportBodyParams {
	@IsArray()
	@ApiProperty({
		description: 'The list of ids of topics which should be exported. If empty no topics are exported.',
		type: [String],
	})
	public readonly topics!: string[];

	@IsArray()
	@ApiProperty({
		description: 'The list of ids of tasks which should be exported. If empty no tasks are exported.',
		type: [String],
	})
	public readonly tasks!: string[];
}
