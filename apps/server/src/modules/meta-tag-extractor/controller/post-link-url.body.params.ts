import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class GetMetaTagDataBody {
	@IsUrl()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	url!: string;
}
