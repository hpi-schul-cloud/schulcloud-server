import { LoggerModule } from '@core/logger';
import { CourseModule } from '@modules/course';
import { CourseSynchronizationHistoryModule } from '@modules/course-synchronization-history';
import { GroupModule } from '@modules/group';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SchulconnexGroupRemovalConsumer } from './amqp';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from './strategy/schulconnex/service';

@Module({
	imports: [
		LoggerModule,
		LegacySchoolModule,
		UserModule,
		RoleModule,
		SystemModule,
		GroupModule,
		CourseModule,
		CourseSynchronizationHistoryModule,
	],
	providers: [SchulconnexGroupRemovalConsumer, SchulconnexGroupProvisioningService, SchulconnexCourseSyncService],
})
export class SchulconnexGroupRemovalConsumerModule {}
