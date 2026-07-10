import { type EntityId } from '@shared/domain/types';
import { type ToolLaunchRequest } from '../../types';
import { type ToolLaunchParams } from './tool-launch-params.interface';

export interface ToolLaunchStrategy {
	createLaunchRequest(userId: EntityId, params: ToolLaunchParams): Promise<ToolLaunchRequest>;
}
