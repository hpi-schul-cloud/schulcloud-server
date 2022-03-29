import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { EntityId } from '@shared/domain';

export class CourseMetadataResponse {
	constructor(
		id: EntityId,
		title: string,
		shortTitle: string,
		displayColor: string,
		startDate?: Date,
		untilDate?: Date
	) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
		this.startDate = startDate;
		this.untilDate = untilDate;
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Title of the Grid element',
	})
	title: string;

	@ApiProperty({
		description: 'Short title of the Grid element',
	})
	shortTitle: string;

	@ApiProperty({
		description: 'Color of the Grid element',
	})
	displayColor: string;

	@ApiProperty({
		description: 'Start date of the course',
	})
	startDate?: Date;

	@ApiProperty({
		description: 'End date of the course. After this the course counts as archived',
	})
	untilDate?: Date;
}

export class CourseMetadataListResponse extends PaginationResponse<CourseMetadataResponse[]> {
	constructor(data: CourseMetadataResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseMetadataResponse] })
	data: CourseMetadataResponse[];
}
