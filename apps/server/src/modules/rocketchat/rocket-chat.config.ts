import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export const ROCKET_CHAT_API_PUBLIC_CONFIG_TOKEN = 'ROCKET_CHAT_API_PUBLIC_CONFIG_TOKEN';
export const ROCKET_CHAT_CONFIG_TOKEN = 'ROCKET_CHAT_CONFIG_TOKEN';

@Configuration()
export class RocketChatPublicApiConfig {
	@ConfigProperty('ROCKETCHAT_SERVICE_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public rocketChatServiceEnabled = false;
}

@Configuration()
export class RocketChatConfig extends RocketChatPublicApiConfig {
	@ConfigProperty('ROCKET_CHAT_URI')
	@IsString()
	@ValidateIf((config: RocketChatConfig) => config.rocketChatServiceEnabled)
	public uri!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_ID')
	@IsString()
	@IsOptional()
	public adminId!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_TOKEN')
	@IsString()
	@IsOptional()
	public adminToken!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_USER')
	@IsString()
	@ValidateIf((config: RocketChatConfig) => config.rocketChatServiceEnabled)
	public adminUser!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_PASSWORD')
	@IsString()
	@ValidateIf((config: RocketChatConfig) => config.rocketChatServiceEnabled)
	public adminPassword!: string;

	@ConfigProperty('ROCKET_CHAT_CLIENT_TIMEOUT_MS')
	@IsNumber()
	@StringToNumber()
	@IsOptional()
	public clientTimeoutInMs?: number;
}
