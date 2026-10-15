import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { CourseModule } from '@modules/course';
import { LearnroomModule } from '@modules/learnroom';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { SagaModule } from '@modules/saga';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { FormerMembershipController, FormerMembershipUc } from './api';
import { SchoolMaterialTransferRequestRepo } from './repo';
import { FORMER_MEMBERSHIP_TIMEOUT_CONFIG_TOKEN, FormerMembershipTimeoutConfig } from './timeout.config';

@RegisterTimeoutConfig(FORMER_MEMBERSHIP_TIMEOUT_CONFIG_TOKEN)
@Module({
	imports: [UserModule, CourseModule, RoomModule, RoomMembershipModule, LearnroomModule, SagaModule],
	controllers: [FormerMembershipController],
	providers: [
		FormerMembershipUc,
		SchoolMaterialTransferRequestRepo,
		{ provide: FORMER_MEMBERSHIP_TIMEOUT_CONFIG_TOKEN, useClass: FormerMembershipTimeoutConfig },
	],
	exports: [FormerMembershipUc, SchoolMaterialTransferRequestRepo],
})
export class FormerMembershipApiModule {}
