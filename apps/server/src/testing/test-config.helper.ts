export class TestConfigHelper<T, K extends keyof T = Extract<keyof T, string>> {
	private originConfigs = new Map<K, T[K]>();

	constructor(private readonly config: T) {}

	public set(key: K, value: T[K]): void {
		if (Object.prototype.hasOwnProperty.call(this.config, key)) {
			this.originConfigs.set(key, this.config[key]);
			this.config[key] = value;
		}
	}

	public reset(): void {
		this.originConfigs.forEach((value, key) => {
			this.config[key] = value;
		});

		this.originConfigs.clear();
	}
}
