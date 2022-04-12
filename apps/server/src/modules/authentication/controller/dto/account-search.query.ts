import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PaginationParams } from '@shared/controller';
import { AccountSearchType } from './account-search.type';

export class AccountSearchQuery extends PaginationParams {
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
}
