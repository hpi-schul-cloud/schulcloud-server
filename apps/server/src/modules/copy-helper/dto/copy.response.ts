import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
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
	public id?: string;

	@ApiPropertyOptional({
		description: 'Title of copied element',
	})
	public title?: string;

	@ApiProperty({
		enum: CopyElementType,
		enumName: 'CopyElementType',
		description: 'Type of copied element',
		example: 'COURSE',
	})
	public type: CopyElementType;

	@ApiPropertyOptional({
		description: 'Id of destination parent reference',
	})
	public destinationId?: string;

	@ApiProperty({
		enum: CopyStatusEnum,
		enumName: 'CopyStatusEnum',
		description: 'Copy progress status of copied element',
		example: 'success',
	})
	public status: CopyStatusEnum;

	@ApiPropertyOptional({
		type: 'array',
		items: { $ref: getSchemaPath(CopyApiResponse) },
		description: 'List of included sub elements with recursive type structure',
	})
	public elements?: CopyApiResponse[];
}
