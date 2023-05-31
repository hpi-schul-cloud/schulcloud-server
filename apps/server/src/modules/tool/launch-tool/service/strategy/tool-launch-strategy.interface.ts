import { ExternalToolConfigDO } from '@shared/domain';
import { PropertyData, ToolLaunchData, ToolLaunchRequest } from '../../types';
import { IToolLaunchParams } from './tool-launch-params.interface';

export interface IToolLaunchStrategy {
	createLaunchData(params: IToolLaunchParams): ToolLaunchData;
	createLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest;
	buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyData[];
	buildToolLaunchRequestPayload(properties: PropertyData[]): string;
}
