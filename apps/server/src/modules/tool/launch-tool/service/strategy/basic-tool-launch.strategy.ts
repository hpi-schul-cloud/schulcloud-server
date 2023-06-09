import { ExternalToolConfigDO } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { PropertyData, PropertyLocation } from '../../types';
import { IToolLaunchStrategy } from './tool-launch-strategy.interface';

@Injectable()
export class BasicToolLaunchStrategy extends AbstractLaunchStrategy implements IToolLaunchStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyData[] {
		return [];
	}

	buildToolLaunchRequestPayload(properties: PropertyData[]): string {
		const bodyProperties = properties.filter((property: PropertyData) => property.location === PropertyLocation.BODY);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		if (Object.keys(payload).length === 0) {
			return '';
		}
		return JSON.stringify(payload);
	}
}
