import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListOauthClientsParams {
	@IsNumber()
	@Min(0)
	@Max(500)
	@IsOptional()
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
	@IsOptional()
	@ApiProperty({
		description: 'The offset from where to start looking.',
		required: false,
		nullable: false,
		minimum: 0,
	})
	offset?: number;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The name of the clients to filter by.',
		required: false,
		nullable: false,
	})
	client_name?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'The owner of the clients to filter by.',
		required: false,
		nullable: false,
	})
	owner?: string;
}
