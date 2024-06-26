import { ApiProperty } from '@nestjs/swagger';

export class CourseFileIdsResponse {
	constructor(courseFileIds: string[]) {
		this.courseFileIds = courseFileIds;
	}

	@ApiProperty({
		type: [String],
		description: 'Array of course file ids',
	})
	public readonly courseFileIds!: string[];
}
