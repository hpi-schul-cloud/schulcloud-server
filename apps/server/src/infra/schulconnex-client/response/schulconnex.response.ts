import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsObject, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPersonResponse } from './schulconnex-person-response';
import { SchulconnexPersonenkontextResponse } from './schulconnex-personenkontext-response';
import { SchulconnexResponseValidationGroups } from './schulconnex-response-validation-groups';

export class SchulconnexResponse {
	@IsString({ groups: [SchulconnexResponseValidationGroups.USER] })
	pid!: string;

	@IsObject({ groups: [SchulconnexResponseValidationGroups.USER] })
	@ValidateNested({ groups: [SchulconnexResponseValidationGroups.USER] })
	@Type(() => SchulconnexPersonResponse)
	person!: SchulconnexPersonResponse;

	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPersonenkontextResponse)
	personenkontexte!: SchulconnexPersonenkontextResponse[];
}
