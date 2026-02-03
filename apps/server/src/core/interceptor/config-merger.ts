import { TimeoutConfig } from './timeout-interceptor-config.interface';

export class MergedTimeoutConfig extends TimeoutConfig {
	constructor(configs: TimeoutConfig[]) {
		super();
		// Merge all configs into one object
		configs.forEach((config) => {
			Object.keys(config).forEach((key) => {
				if (key in this) {
					throw new Error(
						`Duplicate timeout configuration key detected: '${key}'. Each timeout key must be unique across all configurations.`
					);
				}
				this[key] = config[key];
			});
		});
	}
}
