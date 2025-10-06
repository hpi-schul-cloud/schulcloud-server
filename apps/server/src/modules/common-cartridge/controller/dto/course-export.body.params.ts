import { ApiProperty } from '@nestjs/swagger';
import { StringToObject } from '@shared/controller/transformer';
import { IsArray } from 'class-validator';

export class CourseExportBodyParams {
	@IsArray()
	@ApiProperty({
		description: 'The list of ids of topics which should be exported. If empty no topics are exported.',
		type: [String],
	})
	@StringToObject(CourseExportBodyParams)
	public readonly topics!: string[];

	@IsArray()
	@ApiProperty({
		description: 'The list of ids of tasks which should be exported. If empty no tasks are exported.',
		type: [String],
	})
	@StringToObject(CourseExportBodyParams)
	public readonly tasks!: string[];

	@IsArray()
	@ApiProperty({
		description: 'The list of ids of column boards which should be exported. If empty no column boards are exported.',
		type: [String],
	})
	@StringToObject(CourseExportBodyParams)
	public readonly columnBoards!: string[];
}
