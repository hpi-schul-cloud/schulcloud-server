import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccountsByUsernameQuery {
	@IsString()
	@ApiProperty({
		description: 'The search pattern for the user names.',
		required: true,
		nullable: false,
	})
	username!: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@ApiProperty({
		description: 'Determines how many items should be skipped.',
		required: false,
		nullable: true,
		default: 0,
		minimum: 0,
	})
	skip?: number = 0;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@ApiProperty({
		description: 'Determines the page size.',
		required: false,
		nullable: true,
		default: 10,
		minimum: 1,
		maximum: 100,
	})
	limit?: number = 10;

	// Todo what does sort do???
	@IsOptional()
	@ApiProperty({
		description: 'Determines how to sort the results.',
		required: false,
		nullable: true,
	})
	sort?: unknown;
}
