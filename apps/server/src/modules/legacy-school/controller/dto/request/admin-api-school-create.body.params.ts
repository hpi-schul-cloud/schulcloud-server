import { IsString } from 'class-validator';

export class AdminApiSchoolCreateBodyParams {
	@IsString()
	name!: string;

	@IsString()
	federalStateName!: string;
}
