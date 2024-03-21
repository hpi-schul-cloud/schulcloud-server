import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CourseExportBodyParams {
	@IsArray()
	@ApiProperty({
		description: 'The list of ids of topics which should be exported. If empty no topics are exported.',
		type: [String],
	})
	public readonly topics!: string[];
}
