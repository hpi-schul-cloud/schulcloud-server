import { EntityId } from '@shared/domain/types';
import { ToolLaunchData, ToolLaunchRequest } from '../../types';
import { ToolLaunchParams } from './tool-launch-params.interface';

export interface ToolLaunchStrategy {
	createLaunchData(userId: EntityId, params: ToolLaunchParams): Promise<ToolLaunchData>;

	createLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest;
}
