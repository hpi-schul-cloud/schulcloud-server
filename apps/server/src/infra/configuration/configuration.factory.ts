import { type ConfigService } from '@nestjs/config';
import { plainToClassFromExist } from 'class-transformer';
import { type ValidationError, validateSync } from 'class-validator';
import { type WithConfigurationDecorator } from './configuration.decorator';
import { SecretRegistry } from './secret-registry';
import { getSecretPropertyKeys } from './secret.decorator';

/**
 * Factory to load and validate configuration classes decorated with @Configuration()
 * and properties decorated with @ConfigProperty() to take values from environment variables by other names.
 * @see Configuration
 * @see ConfigProperty
 */
export class ConfigurationFactory {
	constructor(private readonly configService: ConfigService) {}

	public loadAndValidateConfigs<T extends object>(Constructor: new () => T): T {
		const configInstance = this.initializeAndLoadConfig<T>(Constructor);

		const validatedConfig = this.validate(configInstance, Constructor.name);
		this.registerSecrets(validatedConfig);

		return validatedConfig;
	}

	private registerSecrets(config: object): void {
		for (const key of getSecretPropertyKeys(config)) {
			SecretRegistry.register((config as Record<string | symbol, unknown>)[key]);
		}
	}

	private initializeAndLoadConfig<T>(Constructor: new () => T): T {
		let configInstance = new Constructor() as T & WithConfigurationDecorator;

		if (!configInstance.getConfigKeys || typeof configInstance.getConfigKeys !== 'function') {
			throw new Error(`The class ${Constructor.name} is not decorated with @Configuration()`);
		}

		const configKeys = configInstance.getConfigKeys();

		configKeys.forEach((key) => {
			const stringKey = key.toString();
			const value = this.configService.get<string>(stringKey);
			if (value !== undefined && value !== null) {
				(configInstance as WithConfigurationDecorator)[stringKey] = value;
			}
		});

		configInstance = plainToClassFromExist(configInstance, { ...configInstance });

		return configInstance;
	}

	private validate<T extends object>(validatedConfig: T, configName: string): T {
		const errors = validateSync(validatedConfig, { skipMissingProperties: false });

		if (errors.length > 0) {
			const formatError = (error: ValidationError, parentPath = ''): string[] => {
				const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;
				const ownErrors = Object.entries(error.constraints ?? {}).map(
					([constraint, message]) => `  - ${propertyPath} [${constraint}]: ${message}`
				);
				const childErrors = error.children?.flatMap((child) => formatError(child, propertyPath)) ?? [];

				return [...ownErrors, ...childErrors];
			};
			const messages = errors.flatMap((error) => formatError(error));
			throw new Error(`Invalid configuration ${configName}:\n${messages.join('\n')}`);
		}

		return validatedConfig;
	}
}
