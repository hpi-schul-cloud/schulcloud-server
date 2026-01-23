import { ConfigProperty, Configuration } from '@infra/configuration';
import { S3Config } from '@infra/s3-client';
import { IsString, IsUrl } from 'class-validator';

export const FWU_S3_CLIENT_CONFIG_TOKEN = 'FWU_S3_CLIENT_CONFIG_TOKEN';

@Configuration()
export class FwuS3ClientConfig implements S3Config {
	@ConfigProperty('FWU_CONTENT__S3_ENDPOINT')
	@IsUrl({ require_tld: false })
	public endpoint!: string;

	@ConfigProperty('FWU_CONTENT__S3_REGION')
	@IsString()
	public region!: string;

	@ConfigProperty('FWU_CONTENT__S3_BUCKET')
	@IsString()
	public bucket!: string;

	@ConfigProperty('FWU_CONTENT__S3_ACCESS_KEY')
	@IsString()
	public accessKeyId!: string;

	@ConfigProperty('FWU_CONTENT__S3_SECRET_KEY')
	@IsString()
	public secretAccessKey!: string;
}
