import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { SYSTEM_REPO, SystemService } from './domain';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';
import { EncryptionConfig } from './encryption.config';

@Module({
	imports: [IdentityManagementModule.register(EncryptionConfig)],
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
