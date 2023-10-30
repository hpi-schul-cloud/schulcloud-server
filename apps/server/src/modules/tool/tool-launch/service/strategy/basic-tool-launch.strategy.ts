import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { LaunchRequestMethod } from '../../types/launch-request-method';
import { PropertyData } from '../../types/property-data';
import { PropertyLocation } from '../../types/property-location';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';

@Injectable()
export class BasicToolLaunchStrategy extends AbstractLaunchStrategy {
	public override buildToolLaunchDataFromConcreteConfig(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: EntityId,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data: IToolLaunchParams
	): Promise<PropertyData[]> {
		return Promise.resolve([]);
	}

	public override buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string | null {
		const bodyProperties = properties.filter((property: PropertyData) => property.location === PropertyLocation.BODY);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		if (Object.keys(payload).length === 0) {
			return null;
		}

		return JSON.stringify(payload);
	}

	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		const hasBodyProperty: boolean = properties.some(
			(property: PropertyData) => property.location === PropertyLocation.BODY
		);

		const launchRequestMethod: LaunchRequestMethod = hasBodyProperty
			? LaunchRequestMethod.POST
			: LaunchRequestMethod.GET;

		return launchRequestMethod;
	}
}
