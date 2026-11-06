import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class ReleaseImageParams {
	@IsMongoId()
	@IsString()
	@ApiProperty({ description: 'The id of the release image', required: true, nullable: false })
	imageId!: string;
}
