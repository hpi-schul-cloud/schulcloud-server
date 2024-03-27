import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { SynchronizationRepo } from './repo';
import { SynchronizationService } from './domain/service';

@Module({
	imports: [UserModule],
	providers: [SynchronizationRepo, SynchronizationService],
	exports: [SynchronizationService],
})
export class SynchronizationModule {}
