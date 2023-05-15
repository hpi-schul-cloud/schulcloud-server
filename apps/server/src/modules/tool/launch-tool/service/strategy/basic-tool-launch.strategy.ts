import { ExternalToolConfigDO, PropertyDataDO, PropertyLocation } from '@shared/domain';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';

export class BasicToolLaunchStrategy extends AbstractLaunchStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyDataDO[] {
		return [];
	}

	buildToolLaunchRequestPayload(properties: PropertyDataDO[]): string {
		const bodyProperties = properties.filter((property: PropertyDataDO) => property.location === PropertyLocation.BODY);
		const payload: Record<string, string> = {};

		for (const property of bodyProperties) {
			payload[property.name] = property.value;
		}

		return JSON.stringify(payload);
	}
}
