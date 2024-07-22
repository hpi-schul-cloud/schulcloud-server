import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { CustomParameter } from '../../common/domain';
import { CustomParameterScope, CustomParameterType, ToolConfigType, ToolContextType } from '../../common/enum';
import {
	ExternalTool,
	ExternalToolDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateData,
	ExternalToolParameterDatasheetTemplateProperty,
} from '../domain';

export class ExternalToolDatasheetMapper {
	public static mapToExternalToolDatasheetTemplateData(
		externalTool: ExternalTool,
		firstName: string,
		lastname: string,
		schoolExternalTool?: SchoolExternalTool,
		schoolName?: string
	): ExternalToolDatasheetTemplateData {
		const externalToolData: ExternalToolDatasheetTemplateData = new ExternalToolDatasheetTemplateData({
			createdAt: new Date().toLocaleDateString('de-DE'),
			creatorName: `${firstName} ${lastname}`,
			instance: ExternalToolDatasheetMapper.getInstanceName(),
			schoolName,
			toolName: externalTool.name,
			toolUrl: externalTool.config.baseUrl,
			isDeactivated: ExternalToolDatasheetMapper.mapToIsDeactivated(externalTool, schoolExternalTool),
			restrictToContexts: externalTool.restrictToContexts
				? ExternalToolDatasheetMapper.mapToLimitedContexts(externalTool)
				: undefined,
			toolType: ExternalToolDatasheetMapper.mapToToolType(externalTool),
		});

		if (externalTool.parameters) {
			externalToolData.parameters = ExternalToolDatasheetMapper.mapToParameterDataList(externalTool);
		}

		if (ExternalTool.isOauth2Config(externalTool.config) && externalTool.config.skipConsent) {
			externalToolData.skipConsent = 'Zustimmung überspringen: ja';
		}

		if (ExternalTool.isLti11Config(externalTool.config)) {
			externalToolData.messageType = externalTool.config.lti_message_type.toString();
			externalToolData.privacy = externalTool.config.privacy_permission.toString();
		}

		return externalToolData;
	}

	private static getInstanceName(): string {
		const instanceName: string = Configuration.get('SC_TITLE') as string;

		return instanceName;
	}

	private static mapToIsDeactivated(
		externalTool: ExternalTool,
		schoolExternalTool?: SchoolExternalTool
	): string | undefined {
		if (externalTool.isDeactivated) {
			return 'Das Tool ist instanzweit deaktiviert';
		}

		if (schoolExternalTool?.isDeactivated) {
			return 'Das Tool ist deaktiviert';
		}

		return undefined;
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
		const toolType: string = externalTool.config.type;
		switch (toolType) {
			case ToolConfigType.OAUTH2:
				return 'OAuth 2.0';
			case ToolConfigType.LTI11:
				return 'LTI 1.1';
			default:
				return 'Basic';
		}
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
			case CustomParameterType.AUTO_MEDIUMID:
				return 'Auto Medium-ID';
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
