import { EntityId } from '@shared/domain';
import { ToolLaunchData, ToolLaunchRequest } from '../../types';
import { IToolLaunchParams } from './tool-launch-params.interface';

export interface IToolLaunchStrategy {
	createLaunchData(userId: EntityId, params: IToolLaunchParams): Promise<ToolLaunchData>;

	createLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest;
}
