import { Module } from '@nestjs/common';
import { MeController } from './api/me.controller';
import { UserMikroOrmRepo } from './repo/user.repo';
import { GetMeUc } from './uc/get-me.uc';
import { USER_REPO } from './uc/interface/user.repo.interface';

@Module({
	controllers: [MeController],
	providers: [GetMeUc, { provide: USER_REPO, useClass: UserMikroOrmRepo }],
})
export class MeAlternativeModule {}
