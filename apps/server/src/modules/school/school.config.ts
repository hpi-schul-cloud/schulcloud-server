import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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

	/**
	 * The S3_KEY is used to encrypt and decrypt sensitive school.provider.secretAccessKey in the database.
	 * If you work with it, your deployment must be set the key.
	 * Otherwise, at runtime, the application will throw an error for the missing key.
	 * See: StorageProviderEncryptedStringType
	 */
	@IsOptional()
	@IsString()
	@ConfigProperty('S3_KEY')
	public S3_KEY?: string;
}
