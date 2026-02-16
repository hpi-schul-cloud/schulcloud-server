import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { BoardModule } from '@modules/board';
import { CourseModule } from '@modules/course';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { SagaModule } from '@modules/saga';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { ImportTokenUC, ShareTokenController, ShareTokenPermissionService, ShareTokenUC } from './api';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from './sharing.config';
import { SharingModule } from './sharing.module';
import { SHARING_TIMEOUT_CONFIG_TOKEN, SharingTimeoutConfig } from './timeout.config';

@Module({
	imports: [
		SharingModule,
		AuthorizationModule,
		CourseModule,
		LearnroomModule,
		LessonModule,
		TaskModule,
		BoardModule,
		RoomMembershipModule,
		RoomModule,
		SchoolModule,
		LoggerModule,
		SagaModule,
		ConfigurationModule.register(SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig),
		ConfigurationModule.register(SHARING_TIMEOUT_CONFIG_TOKEN, SharingTimeoutConfig),
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC, ImportTokenUC, ShareTokenPermissionService],
})
@RegisterTimeoutConfig(SHARING_TIMEOUT_CONFIG_TOKEN)
export class SharingApiModule {}
