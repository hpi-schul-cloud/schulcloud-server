import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

export const META_TAG_EXTRACTOR_CONFIG_TOKEN = 'META_TAG_EXTRACTOR_CONFIG';

@Configuration()
export class MetaTagExtractorConfig {
	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}
