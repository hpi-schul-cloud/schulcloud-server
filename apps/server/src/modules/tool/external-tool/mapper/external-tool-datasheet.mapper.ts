import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	ExternalTool,
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
} from '../domain';
import { CustomParameterScope, CustomParameterType, ToolConfigType, ToolContextType } from '../../common/enum';
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
			isDeactivated: externalTool.isDeactivated ? 'Das Tool ist deaktiviert' : undefined,
			restrictToContexts: externalTool.restrictToContexts
				? ExternalToolDatasheetMapper.mapToLimitedContexts(externalTool)
				: undefined,
			toolType: ExternalToolDatasheetMapper.mapToToolType(externalTool),
		});

		if (externalTool.parameters) {
			externalToolData.parameters = ExternalToolDatasheetMapper.mapToParameterDataList(externalTool);
		}

		if (ExternalTool.isOauth2Config(externalTool.config)) {
			if (externalTool.config.skipConsent) {
				externalToolData.skipConsent = 'ja';
			}
		}

		if (ExternalTool.isLti11Config(externalTool.config)) {
			externalToolData.messageType = externalTool.config.lti_message_type.toString();
			externalToolData.privacy = externalTool.config.privacy_permission.toString();
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

	private static mapToLimitedContexts(externalTool: ExternalTool): string {
		const restrictToContexts: string[] = [];
		if (externalTool.restrictToContexts?.includes(ToolContextType.COURSE)) {
			restrictToContexts.push('Kurs');
		}
		if (externalTool.restrictToContexts?.includes(ToolContextType.BOARD_ELEMENT)) {
			restrictToContexts.push('Kurs-Board');
		}

		const restrictToContextsString = restrictToContexts.join(', ');

		return restrictToContextsString;
	}

	private static mapToToolType(externalTool: ExternalTool): string {
		let toolType: string = externalTool.config.type;
		if (externalTool.config.type === ToolConfigType.OAUTH2) {
			toolType = 'OAuth 2.0';
		}
		if (externalTool.config.type === ToolConfigType.LTI11) {
			toolType = 'LTI 1.1';
		}

		return toolType;
	}

	private static mapToParameterDataList(
		externalTool: ExternalTool
	): ExternalToolParameterDatasheetTemplateData[] | undefined {
		const parameterData: ExternalToolParameterDatasheetTemplateData[] | undefined = externalTool.parameters?.map(
			(parameter: CustomParameter) => {
				const paramData: ExternalToolParameterDatasheetTemplateData =
					ExternalToolDatasheetMapper.mapToParameterData(parameter);

				return paramData;
			}
		);

		return parameterData;
	}

	private static mapToParameterData(parameter: CustomParameter): ExternalToolParameterDatasheetTemplateData {
		const parameterData: ExternalToolParameterDatasheetTemplateData = new ExternalToolParameterDatasheetTemplateData({
			name: parameter.name,
			type: ExternalToolDatasheetMapper.mapToType(parameter),
			properties: ExternalToolDatasheetMapper.mapToProperties(parameter),
			scope: ExternalToolDatasheetMapper.mapToScope(parameter),
			location: parameter.location,
		});

		return parameterData;
	}

	private static mapToProperties(parameter: CustomParameter): string {
		const properties: ExternalToolParameterDatasheetTemplateProperty[] = [];
		if (parameter.isOptional) {
			properties.push(ExternalToolParameterDatasheetTemplateProperty.OPTIONAL);
		} else {
			properties.push(ExternalToolParameterDatasheetTemplateProperty.MANDATORY);
		}

		if (parameter.isProtected) {
			properties.push(ExternalToolParameterDatasheetTemplateProperty.PROTECTED);
		}

		const propertyString = properties.join(', ');
		return propertyString;
	}

	private static mapToType(parameter: CustomParameter): string {
		switch (parameter.type) {
			case CustomParameterType.STRING:
				return 'Zeichenkette';
			case CustomParameterType.BOOLEAN:
				return 'Wahrheitswert';
			case CustomParameterType.NUMBER:
				return 'Zahl';
			case CustomParameterType.AUTO_CONTEXTID:
				return 'Auto Kontext-ID';
			case CustomParameterType.AUTO_CONTEXTNAME:
				return 'Auto Kontext-Name';
			case CustomParameterType.AUTO_SCHOOLID:
				return 'Auto Schul-ID';
			case CustomParameterType.AUTO_SCHOOLNUMBER:
				return 'Auto Schulnummer';
			default:
				return 'unbekannt';
		}
	}

	private static mapToScope(parameter: CustomParameter): string {
		switch (parameter.scope) {
			case CustomParameterScope.CONTEXT:
				return 'Kontext';
			case CustomParameterScope.SCHOOL:
				return 'Schule';
			case CustomParameterScope.GLOBAL:
				return 'Global';
			default:
				return 'unbekannt';
		}
	}
}
