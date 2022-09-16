import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedirectBody {
	@IsString()
	@ApiProperty({ description: 'The redirect url.', required: true, nullable: false })
	redirect_to!: string;
}
