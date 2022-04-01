import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';

export enum ImportUserSortOrder {
	FIRSTNAME = 'firstName',
	LASTNAME = 'lastName',
}

export class SortImportUserParams extends SortingParams<ImportUserSortOrder> {
	@IsOptional()
	@IsEnum(ImportUserSortOrder)
	@ApiPropertyOptional({ enum: ImportUserSortOrder })
	sortBy?: ImportUserSortOrder;
}
