import { ApiProperty } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto/pagination.params';
import { IsEnum, IsString } from 'class-validator';
import { AccountSearchType } from './account-search-type';

export class AccountSearchQueryParams extends PaginationParams {
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
