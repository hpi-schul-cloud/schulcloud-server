import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';

export enum ImportUserSortByParams {
	FIRSTNAME = 'firstName',
	LASTNAME = 'lastName',
}

export class ImportUserSortingParams extends SortingParams<ImportUserSortByParams> {
	@IsOptional()
	@IsEnum(ImportUserSortByParams)
	@ApiPropertyOptional({ enum: ImportUserSortByParams })
	sortBy?: ImportUserSortByParams;
}
