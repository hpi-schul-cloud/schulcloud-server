import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LaunchRequestMethod, LaunchType, PropertyData } from '../../types';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

@Injectable()
export class OAuth2ToolLaunchStrategy extends AbstractLaunchStrategy {
	public override buildToolLaunchDataFromConcreteConfig(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: EntityId,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data: ToolLaunchParams
	): Promise<PropertyData[]> {
		return Promise.resolve([]);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string | null {
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return LaunchRequestMethod.GET;
	}

	public override determineLaunchType(): LaunchType {
		return LaunchType.OAUTH2;
	}
}
