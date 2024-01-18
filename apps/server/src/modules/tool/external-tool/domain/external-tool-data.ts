import { ToolConfigType } from '../../common/enum';
import { ParameterData } from './parameter-data';

export class ExternalToolData {
	createdAt: Date;

	creatorName: string;

	instance: string;

	toolName: string;

	toolUrl: string;

	toolType: ToolConfigType;

	parameters: ParameterData[];

	constructor(externalToolData: ExternalToolData) {
		this.createdAt = externalToolData.createdAt;
		this.creatorName = externalToolData.creatorName;
		this.instance = externalToolData.instance;
		this.toolName = externalToolData.toolName;
		this.toolUrl = externalToolData.toolUrl;
		this.toolType = externalToolData.toolType;
		this.parameters = externalToolData.parameters;
	}
}
