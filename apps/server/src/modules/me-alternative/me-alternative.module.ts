import { Module } from '@nestjs/common';
import { MeController } from './api/me.controller';
import { UserRepo } from './repo/user.repo';
import { GetMeUc } from './uc/get-me.uc';

@Module({
	controllers: [MeController],
	providers: [GetMeUc, UserRepo],
})
export class MeAlternativeModule {}
