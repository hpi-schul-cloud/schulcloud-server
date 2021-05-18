import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SchoolInfoResponse {
	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	name: string;
}
