import { ApiProperty } from '@nestjs/swagger';

export class ContentElementResponse {
	constructor({ id }: ContentElementResponse) {
		this.id = id;
		// this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	// @ApiProperty({ enum: ContentElementType })
	// type: ContentElementType;
}
