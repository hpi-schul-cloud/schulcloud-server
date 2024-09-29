import { LoggerConfig } from '@src/core/logger';

export interface RocketChatUserConfig extends LoggerConfig {
	ROCKET_CHAT_URI: string;
	ROCKET_CHAT_ADMIN_ID: string;
	ROCKET_CHAT_ADMIN_TOKEN: string;
	ROCKET_CHAT_ADMIN_USER: string;
	ROCKET_CHAT_ADMIN_PASSWORD: string;
}
