class TimeoutConfigRegistry {
	private static instance: TimeoutConfigRegistry;
	private tokens: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public static getInstance(): TimeoutConfigRegistry {
		if (!TimeoutConfigRegistry.instance) {
			TimeoutConfigRegistry.instance = new TimeoutConfigRegistry();
		}

		return TimeoutConfigRegistry.instance;
	}

	public register(token: string): void {
		// Check if already registered
		if (!this.tokens.includes(token)) {
			this.tokens.push(token);
		}
	}

	public getTokens(): string[] {
		return [...this.tokens];
	}
}

export const TIMEOUT_CONFIG_REGISTRY = TimeoutConfigRegistry.getInstance();
