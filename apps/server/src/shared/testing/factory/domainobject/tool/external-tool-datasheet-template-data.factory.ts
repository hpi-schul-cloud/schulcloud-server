import {
	CustomParameterLocation,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '@modules/tool/common/enum';
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
				scope: 'Schule',
				location: CustomParameterLocation.BODY,
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
			skipConsent: 'nein',
			toolUrl: 'https://www.oauth2-baseUrl.com/',
		};
		return this.params(params);
	}

	asLti11Tool(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			toolType: ToolConfigType.LTI11,
			messageType: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy: LtiPrivacyPermission.PSEUDONYMOUS,
			toolUrl: 'https://www.lti11-baseUrl.com/',
		};
		return this.params(params);
	}

	withParameters(number: number, customParam?: DeepPartial<ExternalToolParameterDatasheetTemplateData>): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			parameters: externalToolParameterDatasheetTemplateDataFactory.buildList(number, customParam),
		};
		return this.params(params);
	}

	withOptionalParameters(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			isDeactivated: 'Das Tool ist deaktiviert',
			restrictToContexts: ['Kurs', 'Kurs-Board'],
		};
		return this.params(params);
	}
}
export const externalToolDatasheetTemplateDataFactory = ExternalToolDatasheetTemplateDataFactory.define(
	ExternalToolDatasheetTemplateData,
	({ sequence }) => {
		return {
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `John Doe ${sequence}`,
			instance: 'Niedersächsische Bildungscloud',
			toolName: `external-tool-${sequence}`,
			toolUrl: 'https://www.basic-baseUrl.com/',
			toolType: ToolConfigType.BASIC,
		};
	}
);
