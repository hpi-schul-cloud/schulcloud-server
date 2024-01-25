import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '@modules/tool/common/enum';
import { DeepPartial } from 'fishery';
import {
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
} from '@modules/tool/external-tool/domain';
import { DoBaseFactory } from '../do-base.factory';

class ExternalToolParameterDatasheetTemplateDataFactory extends DoBaseFactory<
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData
> {}

export const externalToolParameterDatasheetTemplateDataFactory =
	ExternalToolParameterDatasheetTemplateDataFactory.define(
		ExternalToolParameterDatasheetTemplateData,
		({ sequence }) => {
			return {
				name: `custom-parameter-${sequence}`,
				properties: '',
				type: 'Zeichenkette',
				scope: 'Kontext',
			};
		}
	);

export class ExternalToolDatasheetTemplateDataFactory extends DoBaseFactory<
	ExternalToolDatasheetTemplateData,
	ExternalToolDatasheetTemplateData
> {
	asOauth2Tool(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			toolType: ToolConfigType.OAUTH2,
			skipConsent: 'ja',
		};
		return this.params(params);
	}

	asLti11Tool(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			toolType: ToolConfigType.LTI11,
			messageType: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy: LtiPrivacyPermission.ANONYMOUS,
		};
		return this.params(params);
	}

	withParameters(number: number, customParam?: DeepPartial<ExternalToolParameterDatasheetTemplateData>): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			parameters: externalToolParameterDatasheetTemplateDataFactory.buildList(number, customParam),
		};
		return this.params(params);
	}
}
export const externalToolDatasheetTemplateDataFactory = ExternalToolDatasheetTemplateDataFactory.define(
	ExternalToolDatasheetTemplateData,
	({ sequence }) => {
		return {
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: 'Max Mustermann',
			instance: 'Niedersächsische Bildungscloud',
			toolName: `external-tool-${sequence}`,
			toolUrl: 'https://url.com/',
			toolType: ToolConfigType.BASIC,
			parameters: [],
		};
	}
);
