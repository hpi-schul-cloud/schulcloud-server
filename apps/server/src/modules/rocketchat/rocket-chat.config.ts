import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export const ROCKET_CHAT_CONFIG_TOKEN = 'ROCKET_CHAT_CONFIG_TOKEN';

@Configuration()
export class RocketChatConfig {
	@ConfigProperty('ROCKET_CHAT_URI')
	@IsString()
	public uri!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_ID')
	@IsString()
	public adminId!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_TOKEN')
	@IsString()
	public adminToken!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_USER')
	@IsString()
	public adminUser!: string;

	@ConfigProperty('ROCKET_CHAT_ADMIN_PASSWORD')
	@IsString()
	public adminPassword!: string;

	@ConfigProperty('ROCKET_CHAT_CLIENT_TIMEOUT_MS')
	@IsNumber()
	@StringToNumber()
	@IsOptional()
	public clientTimeoutInMs?: number;
}
