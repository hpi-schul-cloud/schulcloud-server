import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { ReleaseController, ReleaseUc } from './api';
import { ReleaseService } from './domain';
import { ReleaseRepo } from './repo';

@Module({
	imports: [AuthorizationModule],
	providers: [ReleaseService, ReleaseRepo, ReleaseUc],
	controllers: [ReleaseController],
})
export class ReleaseApiModule {}
