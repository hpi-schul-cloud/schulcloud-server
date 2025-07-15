import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { PaginationResponse } from '@shared/controller/dto';
import { EntityId } from '@shared/domain/types';

export class CourseMetadataResponse {
	constructor(
		id: EntityId,
		title: string,
		shortTitle: string,
		displayColor: string,
		isLocked: boolean,
		startDate?: Date,
		untilDate?: Date,
		copyingSince?: Date
	) {
		this.id = id;
		this.title = title;
		this.shortTitle = shortTitle;
		this.displayColor = displayColor;
		this.isLocked = isLocked;
		this.startDate = startDate;
		this.untilDate = untilDate;
		this.copyingSince = copyingSince;
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: bsonStringPattern,
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
		description: 'Indicates if the course is locked and cannot be accessed.',
	})
	isLocked: boolean;

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
