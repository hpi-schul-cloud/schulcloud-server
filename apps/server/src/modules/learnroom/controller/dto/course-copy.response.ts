import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for returning a course copy status document via api.
 */

const COPY_ELEMENT_TYPE = ['course', 'task', 'file', 'leaf'] as const;
const COPY_STATUS = ['success', 'failure', 'not-doing', 'not-implemented'] as const;

type ElementType = typeof COPY_ELEMENT_TYPE[number];
type StatusType = typeof COPY_STATUS[number];
export class CourseCopyApiResponse {
	constructor({ title, type, status }: CourseCopyApiResponse) {
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
		enum: COPY_ELEMENT_TYPE,
		description: 'Type of copied element',
	})
	type: ElementType;

	@ApiProperty({
		type: 'string',
		enum: COPY_STATUS,
		description: 'Copy progress status of copied element',
	})
	status: StatusType;

	@ApiPropertyOptional({
		description: 'List of included sub elements',
	})
	elements?: CourseCopyApiResponse[];
}
