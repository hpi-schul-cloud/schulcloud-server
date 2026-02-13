import { ConfigProperty, Configuration } from '@infra/configuration';
import { S3Config } from '@infra/s3-client';
import { IsString, IsUrl } from 'class-validator';

export const H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN = 'H5P_LIBRARIES_S3_CLIENT_CONFIG_TOKEN';

@Configuration()
export class H5PLibrariesS3ClientConfig implements S3Config {
	@ConfigProperty('H5P_EDITOR__S3_ENDPOINT')
	@IsUrl({ require_tld: false })
	public endpoint!: string;

	@ConfigProperty('H5P_EDITOR__S3_REGION')
	@IsString()
	public region!: string;

	@ConfigProperty('H5P_EDITOR__S3_BUCKET_LIBRARIES')
	@IsString()
	public bucket!: string;

	@ConfigProperty('H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID')
	@IsString()
	public accessKeyId!: string;

	@ConfigProperty('H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY')
	@IsString()
	public secretAccessKey!: string;
}
