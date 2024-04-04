import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { EntityId } from '@shared/domain/types';

export class CourseMetadataResponse {
	constructor(
		id: EntityId,
		title: string,
		shortTitle: string,
		displayColor: string,
		startDate?: Date,
		untilDate?: Date,
		copyingSince?: Date
	) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
		this.startDate = startDate;
		this.untilDate = untilDate;
		this.copyingSince = copyingSince;
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

	@ApiPropertyOptional({
		description: 'Start date of the course',
	})
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date of the course. After this the course counts as archived',
	})
	untilDate?: Date;

	@ApiPropertyOptional({
		description: 'Start of the copying process if it is still ongoing - otherwise property is not set.',
	})
	copyingSince?: Date;
}

export class CourseMetadataListResponse extends PaginationResponse<CourseMetadataResponse[]> {
	constructor(data: CourseMetadataResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [CourseMetadataResponse] })
	data: CourseMetadataResponse[];
}
