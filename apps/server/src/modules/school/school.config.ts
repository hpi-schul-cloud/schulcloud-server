import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsEnum } from 'class-validator';

export enum StudentTeamCreationOption {
	OPT_IN = 'opt-in',
	OPT_OUT = 'opt-out',
	DISABLED = 'disabled',
	ENABLED = 'enabled',
}

export const SCHOOL_CONFIG_TOKEN = 'SCHOOL_CONFIG_TOKEN';

@Configuration()
export class SchoolConfig {
	@ConfigProperty('STUDENT_TEAM_CREATION')
	@IsEnum(StudentTeamCreationOption)
	public studentTeamCreation = StudentTeamCreationOption.OPT_OUT;
}
