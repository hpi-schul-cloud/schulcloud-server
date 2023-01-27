import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserMigrationService } from './service';
import { UserModule } from '../user';

@Module({
	imports: [SchoolModule, SystemModule, UserModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
