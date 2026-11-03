/**
 * Values of config properties marked with @Secret(). The logger masks them in every log line.
 * Static, because log formats are created outside of Nest's dependency injection.
 */
export class SecretRegistry {
	// Shorter values would also match normal text.
	public static readonly MIN_LENGTH = 8;

	private static readonly secrets = new Set<string>();

	private static version = 0;

	public static register(value: unknown): void {
		if (typeof value !== 'string' || value.length < SecretRegistry.MIN_LENGTH || SecretRegistry.secrets.has(value)) {
			return;
		}

		SecretRegistry.secrets.add(value);
		SecretRegistry.version += 1;
	}

	public static getSecrets(): ReadonlySet<string> {
		return SecretRegistry.secrets;
	}

	// Changes whenever a secret is added, so users can cache what they derive from the secrets.
	public static getVersion(): number {
		return SecretRegistry.version;
	}

	public static clear(): void {
		SecretRegistry.secrets.clear();
		SecretRegistry.version += 1;
	}
}
