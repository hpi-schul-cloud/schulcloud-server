import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ExternalTool } from '../domain';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../common/enum';
import { CustomParameter } from '../../common/domain';
import { ExternalToolParameterMustacheTemplateProperty } from './external-tool-parameter-mustache-template-property.enum';
import { ExternalToolMustacheTemplateData } from './external-tool-mustache-template-data';
import { ExternalToolParameterMustacheTemplateData } from './external-tool-parameter-mustache-template-data';

export class ExternalToolMustacheTemplateDataMapper {
	static mapToExternalToolData(
		externalTool: ExternalTool,
		firstName: string,
		lastname: string
	): ExternalToolMustacheTemplateData {
		const externalToolData: ExternalToolMustacheTemplateData = new ExternalToolMustacheTemplateData({
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `${firstName} ${lastname}`,
			instance: ExternalToolMustacheTemplateDataMapper.mapToInstanceName(),
			toolName: externalTool.name,
			toolUrl: externalTool.config.baseUrl,
			isDeactivated: externalTool.isDeactivated ? 'Tool ist deaktiviert' : undefined,
			restrictToContexts: externalTool.restrictToContexts
				? ExternalToolMustacheTemplateDataMapper.mapToLimitedContexts(externalTool)
				: undefined,
			toolType: externalTool.config.type,
			parameters: ExternalToolMustacheTemplateDataMapper.mapToParameterDataList(externalTool),
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

	static mapToInstanceName(): string {
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

	static mapToLimitedContexts(externalTool: ExternalTool): string[] {
		const restrictToContexts: string[] = [];
		if (externalTool.restrictToContexts?.includes(ToolContextType.COURSE)) {
			restrictToContexts.push('Kurs');
		}
		if (externalTool.restrictToContexts?.includes(ToolContextType.BOARD_ELEMENT)) {
			restrictToContexts.push('Kurs-Board');
		}

		return restrictToContexts;
	}

	static mapToParameterDataList(externalTool: ExternalTool): ExternalToolParameterMustacheTemplateData[] {
		const parameterData: ExternalToolParameterMustacheTemplateData[] = [];

		externalTool.parameters?.forEach((parameter: CustomParameter) => {
			const paramData: ExternalToolParameterMustacheTemplateData =
				ExternalToolMustacheTemplateDataMapper.mapToParameterData(parameter);
			parameterData.push(paramData);
		});

		return parameterData;
	}

	static mapToParameterData(parameter: CustomParameter): ExternalToolParameterMustacheTemplateData {
		const parameterData: ExternalToolParameterMustacheTemplateData = new ExternalToolParameterMustacheTemplateData({
			name: parameter.name,
			type: ExternalToolMustacheTemplateDataMapper.mapToType(parameter),
			properties: ExternalToolMustacheTemplateDataMapper.mapToProperties(parameter),
			scope: ExternalToolMustacheTemplateDataMapper.mapToScope(parameter),
		});

		return parameterData;
	}

	static mapToProperties(parameter: CustomParameter): string {
		const properties: ExternalToolParameterMustacheTemplateProperty[] = [];
		let propertiesString = '';
		if (parameter.isOptional) {
			properties.push(ExternalToolParameterMustacheTemplateProperty.OPTIONAL);
		}

		if (parameter.isProtected) {
			properties.push(ExternalToolParameterMustacheTemplateProperty.PROTECTED);
		}

		properties.forEach((property: ExternalToolParameterMustacheTemplateProperty) => {
			propertiesString += `${property}, `;
		});

		propertiesString = propertiesString.substring(0, propertiesString.length - 2);
		return propertiesString;
	}

	static mapToType(parameter: CustomParameter): string {
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

	static mapToScope(parameter: CustomParameter): string {
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
