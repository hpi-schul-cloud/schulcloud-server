import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ContentElementUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the element.',
		required: true,
		nullable: false,
	})
	contentElementId!: string;
}

export class DrawingPermissionUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The name of a drawing.',
		required: true,
		nullable: false,
	})
	drawingName!: string;
}
