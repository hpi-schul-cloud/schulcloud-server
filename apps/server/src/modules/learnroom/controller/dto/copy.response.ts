import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types/copy.types';

/**
 * DTO for returning a copy status document via api.
 */
export class CopyApiResponse {
	constructor({ title, type, status }: CopyApiResponse) {
		this.title = title;
		this.type = type;
		this.status = status;
	}

	@ApiPropertyOptional({
		description: 'Id of copied element',
	})
	id?: string;

	@ApiProperty({
		description: 'Title of copied element',
	})
	title: string;

	@ApiProperty({
		type: 'string',
		enum: CopyElementType,
		description: 'Type of copied element',
	})
	type: CopyElementType;

	@ApiProperty({
		type: 'string',
		enum: CopyStatusEnum,
		description: 'Copy progress status of copied element',
	})
	status: CopyStatusEnum;

	@ApiPropertyOptional({
		description: 'List of included sub elements with recursive type structure',
	})
	elements?: CopyApiResponse[];
}
