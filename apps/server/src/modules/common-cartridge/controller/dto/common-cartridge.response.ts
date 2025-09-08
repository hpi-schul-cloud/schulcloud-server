import { ApiProperty } from '@nestjs/swagger';

export class CourseFileIdsResponse {
	constructor(fileIds: string[]) {
		this.fileIds = fileIds;
	}

	@ApiProperty({
		type: [String],
		description: 'Array of file ids',
	})
	public readonly fileIds!: string[];
}
