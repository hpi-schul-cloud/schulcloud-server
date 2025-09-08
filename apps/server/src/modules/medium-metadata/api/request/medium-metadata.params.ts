import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MediumMetadataParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'The id of the medium.',
		required: true,
		nullable: false,
	})
	public mediumId!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'The id of the media source.',
		required: true,
		nullable: false,
	})
	public mediaSourceId!: string;
}
