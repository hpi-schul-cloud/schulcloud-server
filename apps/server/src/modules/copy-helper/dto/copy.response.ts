import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper/types/copy.types';

/**
 * DTO for returning a copy status document via api.
 */
export class CopyApiResponse {
	constructor({ title, type, status }: CopyApiResponse) {
		if (title) this.title = title;
		this.type = type;
		this.status = status;
	}

	@ApiPropertyOptional({
		description: 'Id of copied element',
	})
	id?: string;

	@ApiPropertyOptional({
		description: 'Title of copied element',
	})
	title?: string;

	@ApiProperty({
		type: 'string',
		enum: CopyElementType,
		description: 'Type of copied element',
	})
	type: CopyElementType;

	@ApiPropertyOptional({
		description: 'Id of destination course',
	})
	destinationCourseId?: string;

	@ApiProperty({
		type: 'string',
		enum: CopyStatusEnum,
		description: 'Copy progress status of copied element',
	})
	status: CopyStatusEnum;

	@ApiPropertyOptional({
		type: [CopyApiResponse],
		description: 'List of included sub elements with recursive type structure',
	})
	elements?: CopyApiResponse[];

	@ApiPropertyOptional({
		isArray: true,
		enum: CopyElementType,
		description: 'Array with listed types of all sub elements',
	})
	elementsTypes?: CopyElementType[];
}
