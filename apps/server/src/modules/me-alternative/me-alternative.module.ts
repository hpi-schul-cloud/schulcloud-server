import { Module } from '@nestjs/common';
import { GetMeUc } from './uc/get-me.uc';
import { UserRepo } from './repo/user.repo';
import { SchoolRepo } from './repo/school.repo';
import { MeController } from './api/me.controller';

@Module({
	controllers: [MeController],
	providers: [GetMeUc, UserRepo, SchoolRepo],
})
export class MeAlternativeModule {}
