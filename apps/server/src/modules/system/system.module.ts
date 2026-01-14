import { IdentityManagementModule } from '@infra/identity-management/identity-management.module';
import { Module } from '@nestjs/common';
import { SYSTEM_REPO, SystemService } from './domain';
import { SystemEncryptionConfig } from './encryption.config';
import { SystemMikroOrmRepo } from './repo/mikro-orm/system.repo';

@Module({
	imports: [IdentityManagementModule.register(SystemEncryptionConfig)],
	providers: [SystemService, { provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
	exports: [SystemService],
})
export class SystemModule {}
