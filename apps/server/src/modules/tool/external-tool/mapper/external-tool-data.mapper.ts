import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ProviderOauthClient } from '@infra/oauth-provider/dto';
import { ExternalTool, ExternalToolData, ParameterData } from '../domain';
import {
	CustomParameterScope,
	CustomParameterType,
	ExternalToolParameterProperty,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '../../common/enum';
import { ExternalToolServiceMapper } from '../service';
import { CustomParameter } from '../../common/domain';

export class ExternalToolDataMapper {
	constructor(private readonly externalToolServiceMapper: ExternalToolServiceMapper) {}

	static mapToExternalToolData(externalTool: ExternalTool, firstName: string, lastname: string): ExternalToolData {
		const externalToolData: ExternalToolData = new ExternalToolData({
			createdAt: new Date(), // TODO N21-1626 human readable output
			creatorName: `${firstName} ${lastname}`,
			instance: ExternalToolDataMapper.mapToInstanceName(),
			toolName: externalTool.name,
			toolUrl: externalTool.config.baseUrl,
			toolType: externalTool.config.type,
			parameters: ExternalToolDataMapper.mapToParameterDataList(externalTool),
		});

		return externalToolData;
	}

	// TODO N21-1626 confirm instance names
	static mapToInstanceName(): string {
		if (Configuration.get('SC_THEME') === 'n21') {
			return 'Niedersächsische Bildungscloud';
		}

		if (Configuration.get('SC_THEME') === 'brb') {
			return 'Schul-Cloud Brandenburg';
		}

		if (Configuration.get('SC_THEME') === 'n21') {
			return 'dBildungscloud';
		}

		return 'dBildungscloud';
	}

	static mapToParameterDataList(externalTool: ExternalTool): ParameterData[] {
		// TODO N21-1626 move to its own service?
		const parameterData: ParameterData[] = [];
		// TODO N21-1626 needs to get clarified with PO
		/* if (externalTool.isDeactivated) {
			const paramData: ParameterData = new ParameterData({name: 'allgemein', properties: [ExternalToolParameterProperty.DEACTIVATED]})

			if (externalTool.isHidden) {
				paramData.properties.push(ExternalToolParameterProperty.HIDDEN)
			}

			parameterData.push(paramData)
		}
		else if (externalTool.isHidden) {
			const paramData: ParameterData = new ParameterData({name: 'allgemein', properties: [ExternalToolParameterProperty.HIDDEN]})
			parameterData.push(paramData)
		} */

		if (externalTool.config.type === ToolConfigType.OAUTH2) {
			const oauthClient: ProviderOauthClient = this.externalToolServiceMapper.mapDoToProviderOauthClient(
				externalTool.name,
				externalTool.config
			);
			const clientIdData: ParameterData = new ParameterData({ name: 'ClientId', type: 'Zeichenkette', properties: [] });
			const clientSecretData: ParameterData = new ParameterData({
				name: 'ClientSecret',
				type: 'Zeichenkette',
				properties: [],
			});
			const redirectUrlsData: ParameterData = new ParameterData({ name: 'Redirect-URLs', type: 'URL', properties: [] });
			const tokenEndpointAuthMethodData: ParameterData = new ParameterData({
				name: 'Token Endpoint Auth Method',
				type: oauthClient.token_endpoint_auth_method,
				properties: [],
			});
			const scopeData: ParameterData = new ParameterData({ name: 'Scope', type: oauthClient.scope, properties: [] });
			parameterData.push(clientIdData, clientSecretData, redirectUrlsData, tokenEndpointAuthMethodData, scopeData);
			if (oauthClient.frontchannel_logout_uri) {
				parameterData.push(new ParameterData({ name: 'Frontchannel Logout Url', type: 'URL', properties: [] }));
			}
			// TODO N21-1626 skip consent - possibly
		}

		if (externalTool.config.type === ToolConfigType.LTI11) {
			const keyData: ParameterData = new ParameterData({ name: 'Key', type: 'Zeichenkette', properties: [] });
			const secretData: ParameterData = new ParameterData({ name: 'Secret', type: 'Zeichenkette', properties: [] });
			const messageTypeData: ParameterData = new ParameterData({
				name: 'Message Type',
				type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				properties: [],
			}); // TODO N21-1626 map config to get values
			const languageData: ParameterData = new ParameterData({ name: 'Sprache', type: 'De-de', properties: [] }); // TODO N21-1626 map config to get values
			const privacyData: ParameterData = new ParameterData({
				name: 'Privatsphäre',
				type: LtiPrivacyPermission.ANONYMOUS,
				properties: [],
			}); // TODO N21-1626 map config to get values
			parameterData.push(keyData, secretData, messageTypeData, languageData, privacyData);
			// TODO N21-1626 if (recourse link id) parameterData.push()
		}

		externalTool.parameters?.forEach((parameter: CustomParameter) => {
			const paramData: ParameterData = ExternalToolDataMapper.mapToParameterData(parameter);
			parameterData.push(paramData);
		});

		return parameterData;
	}

	static mapToParameterData(parameter: CustomParameter): ParameterData {
		const properties: ExternalToolParameterProperty[] = [];
		if (parameter.isOptional) {
			properties.push(ExternalToolParameterProperty.OPTIONAL);

			if (parameter.isProtected) {
				properties.push(ExternalToolParameterProperty.PROTECTED);
			}
		} else if (parameter.isProtected) {
			properties.push(ExternalToolParameterProperty.PROTECTED);
		}

		let type = '';
		switch (parameter.type) {
			case CustomParameterType.STRING:
				type = 'Zeichenkette';
				break;
			case CustomParameterType.BOOLEAN:
				type = 'Wahrheitswert';
				break;
			case CustomParameterType.NUMBER:
				type = 'Zahl';
				break;
			case CustomParameterType.AUTO_CONTEXTID:
				type = 'Auto Kontext-ID';
				break;
			case CustomParameterType.AUTO_CONTEXTNAME:
				type = 'Auto Kontext-Name';
				break;
			case CustomParameterType.AUTO_SCHOOLID:
				type = 'Auto Schul-ID';
				break;
			case CustomParameterType.AUTO_SCHOOLNUMBER:
				type = 'Auto Schulnummer';
				break;
			default:
				break;
		}

		let scope = '';
		switch (parameter.scope) {
			case CustomParameterScope.CONTEXT:
				scope = 'Kontext';
				break;
			case CustomParameterScope.SCHOOL:
				scope = 'Schule';
				break;
			case CustomParameterScope.GLOBAL:
				scope = 'Global';
				break;
			default:
				break;
		}

		const parameterData: ParameterData = new ParameterData({
			name: parameter.name,
			type,
			properties,
			scope,
		});

		return parameterData;
	}
}
