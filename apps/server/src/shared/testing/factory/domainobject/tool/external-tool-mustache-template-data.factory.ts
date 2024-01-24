import {
	ExternalToolMustacheTemplateData,
	ExternalToolParameterMustacheTemplateData,
} from '@modules/tool/external-tool/mustache-template';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '@modules/tool/common/enum';
import { DeepPartial } from 'fishery';
import { CustomParameter } from '@modules/tool/common/domain';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { DoBaseFactory } from '../do-base.factory';
import { customParameterFactory } from './external-tool.factory';

export class ExternalToolMustacheTemplateDataFactory extends DoBaseFactory<
	ExternalToolMustacheTemplateData,
	ExternalToolMustacheTemplateData
> {
	asOauth2Tool(): this {
		const params: DeepPartial<ExternalToolMustacheTemplateData> = {
			toolType: ToolConfigType.OAUTH2,
			skipConsent: 'ja',
		};
		return this.params(params);
	}

	asLti11Tool(): this {
		const params: DeepPartial<ExternalToolMustacheTemplateData> = {
			toolType: ToolConfigType.LTI11,
			messageType: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy: LtiPrivacyPermission.ANONYMOUS,
		};
		return this.params(params);
	}

	withParameters(number: number, customParam?: DeepPartial<CustomParameter>): this {
		const params: DeepPartial<ExternalToolParameterMustacheTemplateData> = {
			parameters: externalToolParameterMustacheTemplateDataFactory.buildList(number, customParam),
		};
		return this.params(params);
	}
}
export const externalToolMustacheTemplateDataFactory = ExternalToolMustacheTemplateDataFactory.define(
	ExternalToolMustacheTemplateData,
	({ sequence }) => {
		return {
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: 'Max Mustermann',
			instance: 'Niedersächsische Bildungscloud',
			toolName: `external-tool-${sequence}`,
			toolUrl: 'https://url.com/',
			// isDeactivated?: string;
			// restrictToContexts?: string[];
			toolType: ToolConfigType.BASIC,
			parameters: [], // ExternalToolParameterMustacheTemplateData[];
		};
	}
);
