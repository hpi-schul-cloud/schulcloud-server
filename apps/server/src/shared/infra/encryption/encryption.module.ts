import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerModule } from '@src/core/logger';
import { DefaultEncryptionService, LdapEncryptionService } from './encryption.interface';
import { SymetricKeyEncryptionService } from './encryption.service';

function encryptionProviderFactory(configService: ConfigService, logger: Logger, aesKey: string) {
	const key = configService.get<string>(aesKey);
	return new SymetricKeyEncryptionService(logger, key);
}

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: DefaultEncryptionService,
			useFactory: (configService: ConfigService, logger: Logger) =>
				encryptionProviderFactory(configService, logger, 'AES_KEY'),
			inject: [ConfigService, Logger],
		},
		{
			provide: LdapEncryptionService,
			useFactory: (configService: ConfigService, logger: Logger) =>
				encryptionProviderFactory(configService, logger, 'LDAP_PASSWORD_ENCRYPTION_KEY'),
			inject: [ConfigService, Logger],
		},
	],
	exports: [DefaultEncryptionService, LdapEncryptionService],
})
export class EncryptionModule {}
