import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PaginationParams, SanitizeHtml } from '@shared/controller';
import { AccountSearchType } from '../../../domain/type/account-search-type';

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
	@SanitizeHtml()
	@ApiProperty({
		description: 'The search value.',
		required: true,
		nullable: false,
	})
	value!: string;
}
