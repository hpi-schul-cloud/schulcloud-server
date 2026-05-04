import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CopyElementType, CopyStatusEnum } from '../types/copy.types';

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
		type: String,
		description: 'Type of copied element',
		example: 'COURSE',
	})
	type: CopyElementType;

	@ApiPropertyOptional({
		description: 'Id of destination parent reference',
	})
	destinationId?: string;

	@ApiProperty({
		type: String,
		description: 'Copy progress status of copied element',
		example: 'success',
	})
	status: CopyStatusEnum;

	@ApiPropertyOptional({
		type: 'array',
		items: { $ref: '#/components/schemas/CopyApiResponse' },
		description: 'List of included sub elements with recursive type structure',
	})
	elements?: CopyApiResponse[];
}
