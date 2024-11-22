import { CustomParameterEntry } from '../../common/domain';
import { Lti11DeepLinkContentItemParams, Lti11DeepLinkParams } from '../controller/dto';
import { LtiDeepLink } from '../domain';

export class LtiDeepLinkRequestMapper {
	public static mapRequestToDO(params: Lti11DeepLinkParams): LtiDeepLink | undefined {
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
					text: contentItem.text,
					url: contentItem.url,
					parameters,
					availableFrom: contentItem.available?.startDatetime,
					availableUntil: contentItem.available?.endDatetime,
					submissionFrom: contentItem.submission?.startDatetime,
					submissionUntil: contentItem.submission?.endDatetime,
			  })
			: undefined;

		return deepLink;
	}
}
