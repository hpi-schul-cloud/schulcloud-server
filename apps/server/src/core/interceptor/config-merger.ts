import { TimeoutConfig } from './timeout-interceptor-config.interface';

export class MergedTimeoutConfig extends TimeoutConfig {
	constructor(configs: TimeoutConfig[]) {
		super();
		// Merge all configs into one object
		configs.forEach((config) => {
			Object.keys(config).forEach((key) => {
				this[key] = config[key];
			});
		});
	}
}
