import { ConfigProperty, Configuration } from '@infra/configuration';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { IsArray, IsUrl } from 'class-validator';

export const RELEASES_CONFIG_TOKEN = 'RELEASES_CONFIG_TOKEN';

@Configuration()
export class ReleasesConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('RELEASE_NOTES_REPO_URL')
	public releaseNotesRepoUrl = 'https://api.github.com/repos/hpi-schul-cloud/RELEASE-NOTES/releases';

	/**
	 * Origin + path prefixes from which release images may be downloaded (also checked for every redirect hop).
	 */
	@ConfigProperty('RELEASE_IMAGE_ALLOWED_SOURCES')
	@CommaSeparatedStringToArray()
	@IsArray()
	@IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
	public releaseImageAllowedSources: string[] = [
		'https://raw.githubusercontent.com/hpi-schul-cloud/RELEASE-NOTES/',
		// images added via drag & drop in the GitHub release editor
		'https://github.com/user-attachments/assets/',
		// redirect target of user-attachments (CSP ignores paths after redirects, so host only)
		'https://github-production-user-asset-6210df.s3.amazonaws.com',
	];
}
