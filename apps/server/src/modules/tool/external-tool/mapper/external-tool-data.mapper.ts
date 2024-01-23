import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ExternalTool, ExternalToolData, ParameterData } from '../domain';
import { CustomParameterScope, CustomParameterType, ExternalToolParameterProperty } from '../../common/enum';
import { CustomParameter } from '../../common/domain';

export class ExternalToolDataMapper {
	static mapToExternalToolData(externalTool: ExternalTool, firstName: string, lastname: string): ExternalToolData {
		const externalToolData: ExternalToolData = new ExternalToolData({
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `${firstName} ${lastname}`,
			instance: ExternalToolDataMapper.mapToInstanceName(),
			toolName: externalTool.name,
			toolUrl: externalTool.config.baseUrl,
			isDeactivated: externalTool.isDeactivated ? 'tool is deactivated' : undefined,
			limitedToContexts: externalTool.restrictToContexts ? externalTool.restrictToContexts : undefined,
			toolType: externalTool.config.type,
			parameters: ExternalToolDataMapper.mapToParameterDataList(externalTool),
		});

		if (ExternalTool.isOauth2Config(externalTool.config)) {
			externalToolData.skipConsent = externalTool.config.skipConsent;
		}

		if (ExternalTool.isLti11Config(externalTool.config)) {
			externalToolData.messageType = externalTool.config.lti_message_type;
			externalToolData.privacy = externalTool.config.privacy_permission;
		}

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

		if (Configuration.get('SC_THEME') === 'dbc') {
			return 'dBildungscloud';
		}

		return 'dBildungscloud';
	}

	static mapToParameterDataList(externalTool: ExternalTool): ParameterData[] {
		// TODO N21-1626 move to its own service?
		const parameterData: ParameterData[] = [];

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
