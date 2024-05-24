import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomParameterEntry } from '../../common/domain';
import { LtiDeepLink } from '../domain/lti-deep-link';
import { ContextExternalToolUc } from '../uc';
import { ContextExternalToolIdParams, Lti11DeepLinkParams } from './dto';
import { Lti11DeepLinkContentItemParams } from './dto/lti11-deep-link/lti11-deep-link-content-item.params';

@ApiTags('Tool')
@Controller('tools/context-external-tools')
export class ToolDeepLinkController {
	constructor(private readonly contextExternalToolUc: ContextExternalToolUc) {}

	@Post(':contextExternalToolId/lti11-deep-link-callback')
	async deepLink(@Param() params: ContextExternalToolIdParams, @Body() body: Lti11DeepLinkParams): Promise<void> {
		const deepLink: LtiDeepLink | undefined = ToolDeepLinkController.mapToDeepLink(body);

		await this.contextExternalToolUc.updateLtiDeepLink(body, params.contextExternalToolId, deepLink);
	}

	private static mapToDeepLink(body: Lti11DeepLinkParams): LtiDeepLink | undefined {
		const contentItem: Lti11DeepLinkContentItemParams | undefined = body.content_items?.['@graph'][0];

		let parameters: CustomParameterEntry[] = [];
		if (contentItem?.custom) {
			parameters = Object.keys(contentItem.custom).map(
				(key: string) => new CustomParameterEntry({ name: key, value: contentItem.custom?.[key] })
			);
		}

		const deepLink: LtiDeepLink | undefined = contentItem
			? new LtiDeepLink({
					mediaType: contentItem.mediaType,
					url: contentItem.url,
					title: contentItem.title,
					text: contentItem.text,
					parameters,
					availableFrom: contentItem.available?.startDatetime,
					availableUntil: contentItem.available?.endDatetime,
					submissionFrom: contentItem.submission?.startDatetime,
					submissionUntil: contentItem.submission?.endDatetime,
			  })
			: undefined;

		return deepLink;
	}

	private static mapToAuth(body: Lti11DeepLinkParams): void {}
}
