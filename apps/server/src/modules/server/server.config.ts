import { Configuration } from '@hpi-schul-cloud/commons';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { AccountConfig } from '@modules/account';
import type { FilesStorageClientConfig } from '@modules/files-storage-client';
import type { CommonCartridgeConfig } from '@modules/learnroom/common-cartridge';
import type { UserConfig } from '@modules/user';
import type { CoreModuleConfig } from '@src/core';
import { MailConfig } from '@src/infra/mail/interfaces/mail-config';
import { MiddlewareConsumer } from '@nestjs/common';
import { RedisClient } from 'redis';
import { LegacyLogger } from '@src/core/logger';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface ServerConfig
	extends CoreModuleConfig,
		UserConfig,
		FilesStorageClientConfig,
		AccountConfig,
		IdentityManagementConfig,
		CommonCartridgeConfig,
		MailConfig,
		XApiKeyConfig {
	NODE_ENV: string;
	SC_DOMAIN: string;
}

const config: ServerConfig = {
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_IMSCC_COURSE_EXPORT_ENABLED: Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((apiKey) => apiKey.trim()),
	ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS: (Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
};

export const serverConfig = () => config;

export const setupSessions = (
	consumer: MiddlewareConsumer,
	redisClient: RedisClient | undefined,
	logger: LegacyLogger
) => {
	const sessionDuration: number = Configuration.get('SESSION__EXPIRES_SECONDS') as number;

	let store: connectRedis.RedisStore | undefined;
	if (redisClient) {
		const RedisStore: connectRedis.RedisStore = connectRedis(session);
		store = new RedisStore({
			client: redisClient,
			ttl: sessionDuration,
		});
	} else {
		logger.warn(
			'The RedisStore for sessions is not setup, since the environment variable REDIS_URI is not defined. Sessions are using the build-in MemoryStore. This should not be used in production!'
		);
	}

	consumer
		.apply(
			session({
				store,
				secret: Configuration.get('SESSION__SECRET') as string,
				resave: false,
				saveUninitialized: false,
				name: Configuration.has('SESSION__NAME') ? (Configuration.get('SESSION__NAME') as string) : undefined,
				proxy: Configuration.has('SESSION__PROXY') ? (Configuration.get('SESSION__PROXY') as boolean) : undefined,
				cookie: {
					secure: Configuration.get('SESSION__SECURE') as boolean,
					sameSite: Configuration.get('SESSION__SAME_SITE') as boolean | 'lax' | 'strict' | 'none',
					httpOnly: Configuration.get('SESSION__HTTP_ONLY') as boolean,
					maxAge: sessionDuration * 1000,
				},
			})
		)
		.forRoutes('*');
};
