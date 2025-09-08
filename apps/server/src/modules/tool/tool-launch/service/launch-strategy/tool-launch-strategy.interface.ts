import { EntityId } from '@shared/domain/types';
import { ToolLaunchRequest } from '../../types';
import { ToolLaunchParams } from './tool-launch-params.interface';

export interface ToolLaunchStrategy {
	createLaunchRequest(userId: EntityId, params: ToolLaunchParams): Promise<ToolLaunchRequest>;
}
