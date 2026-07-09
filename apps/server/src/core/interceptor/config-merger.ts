import { TimeoutConfig } from './timeout-interceptor-config.interface';

export class MergedTimeoutConfig extends TimeoutConfig {
	constructor(configs: TimeoutConfig[]) {
		super();
		const assignedKeys = new Set<string>();

		// Merge all configs into one object.
		// Under SWC, declared class fields can exist as own properties with undefined values,
		// so duplicate detection must rely on actually assigned keys.
		configs.forEach((config) => {
			Object.keys(config).forEach((key) => {
				const value = config[key];
				if (value === undefined) {
					return;
				}

				if (assignedKeys.has(key)) {
					throw new Error(
						`Duplicate timeout configuration key detected: '${key}'. Each timeout key must be unique across all configurations.`
					);
				}

				this[key] = value;
				assignedKeys.add(key);
			});
		});
	}
}
