import { ApiProperty } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsEnum, IsString } from 'class-validator';
import { AccountSearchType } from '../../../domain/type/account-search-type';

export class AccountSearchQueryParams extends PaginationParams {
	@IsEnum(AccountSearchType)
	@ApiProperty({
		description: 'The search criteria.',
		enum: AccountSearchType,
		required: true,
		nullable: false,
	})
	public type!: AccountSearchType;

	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'The search value.',
		required: true,
		nullable: false,
	})
	public value!: string;
}
