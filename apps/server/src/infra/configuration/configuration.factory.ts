import { ConfigService } from '@nestjs/config';
import { plainToClassFromExist } from 'class-transformer';
import { validateSync } from 'class-validator';
import { WithConfigurationDecorator } from './configuration.decorator';

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

		const validatedConfig = this.validate(configInstance);

		return validatedConfig;
	}

	private initializeAndLoadConfig<T>(Constructor: new () => T): T {
		let configInstance = new Constructor() as T & WithConfigurationDecorator;
		console.log('Loading configuration for', configInstance);

		if (!configInstance.getConfigKeys || typeof configInstance.getConfigKeys !== 'function') {
			throw new Error(
				`The class ${configInstance.constructor as unknown as string} is not decorated with @Configuration()`
			);
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

	private validate<T extends object>(validatedConfig: T): T {
		const errors = validateSync(validatedConfig, { skipMissingProperties: false });
		console.log('Validation errors:', errors, validatedConfig);

		if (errors.length > 0) {
			throw new Error(`Config validation error`, { cause: errors });
		}

		return validatedConfig;
	}
}
