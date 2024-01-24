import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	ExternalTool,
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
} from '../domain';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../common/enum';
import { CustomParameter } from '../../common/domain';

export class ExternalToolDatasheetMapper {
	public static mapToExternalToolDatasheetTemplateData(
		externalTool: ExternalTool,
		firstName: string,
		lastname: string
	): ExternalToolDatasheetTemplateData {
		const externalToolData: ExternalToolDatasheetTemplateData = new ExternalToolDatasheetTemplateData({
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `${firstName} ${lastname}`,
			instance: ExternalToolDatasheetMapper.mapToInstanceName(),
			toolName: externalTool.name,
			toolUrl: externalTool.config.baseUrl,
			isDeactivated: externalTool.isDeactivated ? 'Tool ist deaktiviert' : undefined,
			restrictToContexts: externalTool.restrictToContexts
				? ExternalToolDatasheetMapper.mapToLimitedContexts(externalTool)
				: undefined,
			toolType: externalTool.config.type,
			parameters: ExternalToolDatasheetMapper.mapToParameterDataList(externalTool),
		});

		if (ExternalTool.isOauth2Config(externalTool.config)) {
			if (externalTool.config.skipConsent) {
				externalToolData.skipConsent = 'ja';
			} else {
				externalToolData.skipConsent = 'nein';
			}
		}

		if (ExternalTool.isLti11Config(externalTool.config)) {
			externalToolData.messageType = externalTool.config.lti_message_type;
			externalToolData.privacy = externalTool.config.privacy_permission;
		}

		return externalToolData;
	}

	private static mapToInstanceName(): string {
		if (Configuration.get('SC_THEME') === 'n21') {
			return 'Niedersächsische Bildungscloud';
		}

		if (Configuration.get('SC_THEME') === 'brb') {
			return 'Schul-Cloud Brandenburg';
		}

		if (Configuration.get('SC_THEME') === 'thr') {
			return 'Thüringer Schulcloud';
		}

		if (Configuration.get('SC_THEME') === 'default') {
			return 'dBildungscloud';
		}

		return 'unbekannt';
	}

	private static mapToLimitedContexts(externalTool: ExternalTool): string[] {
		const restrictToContexts: string[] = [];
		if (externalTool.restrictToContexts?.includes(ToolContextType.COURSE)) {
			restrictToContexts.push('Kurs');
		}
		if (externalTool.restrictToContexts?.includes(ToolContextType.BOARD_ELEMENT)) {
			restrictToContexts.push('Kurs-Board');
		}

		return restrictToContexts;
	}

	private static mapToParameterDataList(externalTool: ExternalTool): ExternalToolParameterDatasheetTemplateData[] {
		const parameterData: ExternalToolParameterDatasheetTemplateData[] = [];

		externalTool.parameters?.forEach((parameter: CustomParameter) => {
			const paramData: ExternalToolParameterDatasheetTemplateData =
				ExternalToolDatasheetMapper.mapToParameterData(parameter);
			parameterData.push(paramData);
		});

		return parameterData;
	}

	private static mapToParameterData(parameter: CustomParameter): ExternalToolParameterDatasheetTemplateData {
		const parameterData: ExternalToolParameterDatasheetTemplateData = new ExternalToolParameterDatasheetTemplateData({
			name: parameter.name,
			type: ExternalToolDatasheetMapper.mapToType(parameter),
			properties: ExternalToolDatasheetMapper.mapToProperties(parameter),
			scope: ExternalToolDatasheetMapper.mapToScope(parameter),
		});

		return parameterData;
	}

	private static mapToProperties(parameter: CustomParameter): string {
		const properties: ExternalToolParameterDatasheetTemplateProperty[] = [];
		let propertiesString = '';
		if (parameter.isOptional) {
			properties.push(ExternalToolParameterDatasheetTemplateProperty.OPTIONAL);
		}

		if (parameter.isProtected) {
			properties.push(ExternalToolParameterDatasheetTemplateProperty.PROTECTED);
		}

		properties.forEach((property: ExternalToolParameterDatasheetTemplateProperty) => {
			propertiesString += `${property}, `;
		});

		propertiesString = propertiesString.substring(0, propertiesString.length - 2);
		return propertiesString;
	}

	private static mapToType(parameter: CustomParameter): string {
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

		return type;
	}

	private static mapToScope(parameter: CustomParameter): string {
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

		return scope;
	}
}
