import { EntityId } from '@shared/domain/types/entity-id';
import { ToolLaunchData } from '../../types/tool-launch-data';
import { ToolLaunchRequest } from '../../types/tool-launch-request';
import { IToolLaunchParams } from './tool-launch-params.interface';

export interface IToolLaunchStrategy {
	createLaunchData(userId: EntityId, params: IToolLaunchParams): Promise<ToolLaunchData>;

	createLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest;
}
