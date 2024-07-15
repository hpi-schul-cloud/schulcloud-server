import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TicketParams {
	@IsString()
	@ApiProperty({
		description: 'The ticket to be evaluated.',
		required: true,
		nullable: false,
	})
	ticket!: string;
}
