import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingQuery } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';

export enum ImportUserSortByQuery {
	FIRSTNAME = 'firstName',
	LASTNAME = 'lastName',
}

export class ImportUserSortingQuery extends SortingQuery<ImportUserSortByQuery> {
	@IsOptional()
	@IsEnum(ImportUserSortByQuery)
	@ApiPropertyOptional({ enum: ImportUserSortByQuery })
	sortBy?: ImportUserSortByQuery;
}
