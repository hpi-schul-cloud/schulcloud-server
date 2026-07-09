import { CustomParameterLocation, LtiMessageType, LtiPrivacyPermission } from '@modules/tool/common/enum';
import {
	type ExternalToolDatasheetTemplateData,
	type ExternalToolParameterDatasheetTemplateData,
} from '@modules/tool/external-tool/domain';
import { type DeepPartial, Factory } from 'fishery';

export const externalToolParameterDatasheetTemplateDataFactory = Factory.define<
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData
>(({ sequence }) => {
	return {
		name: `custom-parameter-${sequence}`,
		properties: '',
		type: 'Zeichenkette',
		scope: 'Schule',
		location: CustomParameterLocation.BODY,
	};
});

export class ExternalToolDatasheetTemplateDataFactory extends Factory<ExternalToolDatasheetTemplateData> {
	public asOauth2Tool(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			toolType: 'OAuth 2.0',
			skipConsent: 'Zustimmung überspringen: ja',
			toolUrl: 'https://www.oauth2-baseurl.com/',
		};
		return this.params(params);
	}

	public asLti11Tool(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			toolType: 'LTI 1.1',
			messageType: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			privacy: LtiPrivacyPermission.PSEUDONYMOUS,
			toolUrl: 'https://www.lti11-baseurl.com/',
		};
		return this.params(params);
	}

	public withParameters(number: number, customParam?: DeepPartial<ExternalToolParameterDatasheetTemplateData>): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			parameters: externalToolParameterDatasheetTemplateDataFactory.buildList(number, customParam),
		};
		return this.params(params);
	}

	public withOptionalProperties(): this {
		const params: DeepPartial<ExternalToolDatasheetTemplateData> = {
			isDeactivated: 'Das Tool ist instanzweit deaktiviert',
			restrictToContexts: 'Kurs, Kurs-Board',
		};
		return this.params(params);
	}
}
export const externalToolDatasheetTemplateDataFactory = ExternalToolDatasheetTemplateDataFactory.define(
	({ sequence }) => {
		return {
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `John Doe ${sequence}`,
			instance: 'dBildungscloud',
			toolName: `external-tool-${sequence}`,
			toolUrl: 'https://www.basic-baseurl.com/',
			toolType: 'Basic',
		};
	}
);
