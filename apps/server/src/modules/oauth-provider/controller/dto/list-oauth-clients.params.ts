import { IsNumber, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListOauthClientsParams {
	@IsNumber()
	@Min(0)
	@Max(500)
	@ApiProperty({
		description: 'The maximum amount of clients to returned, upper bound is 500 clients.',
		required: false,
		nullable: false,
		minimum: 0,
		maximum: 500,
	})
	limit?: number;

	@IsNumber()
	@Min(0)
	@ApiProperty({
		description: 'The offset from where to start looking.',
		required: false,
		nullable: false,
		minimum: 0,
	})
	offset?: number;

	@IsString()
	@ApiProperty({
		description: 'The name of the clients to filter by.',
		required: false,
		nullable: false,
	})
	client_name?: string;

	@IsString()
	@ApiProperty({
		description: 'The owner of the clients to filter by.',
		required: false,
		nullable: false,
	})
	owner?: string;
}
