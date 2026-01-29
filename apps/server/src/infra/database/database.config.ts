import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { InternalDatabaseConfig } from './database-module.options';

export const DATABASE_CONFIG_TOKEN = 'DATABASE_CONFIG_TOKEN';

@Configuration()
export class DatabaseConfig implements InternalDatabaseConfig {
	@ConfigProperty('DB_URL')
	@IsString()
	public dbUrl!: string;

	@ConfigProperty('DB_USERNAME')
	@IsString()
	@IsOptional()
	public dbUsername?: string;

	@ConfigProperty('DB_PASSWORD')
	@IsString()
	@IsOptional()
	public dbPassword?: string;

	@ConfigProperty('DB_ENSURE_INDEXES')
	@IsBoolean()
	@StringToBoolean()
	public dbEnsureIndexes = false;

	@ConfigProperty('DB_ALLOW_GLOBAL_CONTEXT')
	@IsBoolean()
	@StringToBoolean()
	public dbAllowGlobalContext = true;

	@ConfigProperty('DB_DEBUG')
	@IsBoolean()
	@StringToBoolean()
	public dbDebug = false;
}
