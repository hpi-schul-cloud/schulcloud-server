import { CustomParameterEntry } from '../../common/domain';
import { Lti11DeepLinkContentItemParams, Lti11DeepLinkParams } from '../controller/dto';
import { LtiDeepLink, LtiDeepLinkAuthorizable } from '../domain';

export class LtiDeepLinkRequestMapper {
	public static mapRequestToDO(params: Lti11DeepLinkParams) {
		const contentItem: Lti11DeepLinkContentItemParams | undefined = params.content_items?.['@graph'][0];

		let parameters: CustomParameterEntry[] = [];
		if (contentItem?.custom) {
			parameters = Object.entries(contentItem.custom).map(
				([key, value]: [string, string]) => new CustomParameterEntry({ name: key, value })
			);
		}

		const deepLink: LtiDeepLink | undefined = contentItem
			? new LtiDeepLink({
					mediaType: contentItem.mediaType,
					title: contentItem.title,
					parameters,
			  })
			: undefined;

		return deepLink;
	}

	public static mapRequestToAuthorizable(params: Lti11DeepLinkParams) {
		const authorizable: LtiDeepLinkAuthorizable = new LtiDeepLinkAuthorizable({
			state: params.data,
			oauthVersion: params.oauth_version,
			oauthNonce: params.oauth_nonce,
			oauthTimestamp: params.oauth_timestamp,
			oauthSignatureMethod: params.oauth_signature_method,
			oauthConsumerKey: params.oauth_consumer_key,
			oauthSignature: params.oauth_signature,
		});

		return authorizable;
	}
}
