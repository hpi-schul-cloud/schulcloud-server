import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetMetaTagDataBody {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	url!: string;
}
