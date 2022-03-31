import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AccountSearchType {
	USER_ID = 'userId',
	USERNAME = 'username',
}

export class AccountSearchQuery {
	@IsEnum(AccountSearchType)
	@ApiProperty({
		description: 'The search criteria.',
		enum: AccountSearchType,
		required: true,
		nullable: false,
	})
	type!: AccountSearchType;

	@IsString()
	@ApiProperty({
		description: 'The search value.',
		required: true,
		nullable: false,
	})
	value!: string;

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
	skip?: number;

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
	limit?: number;
}
