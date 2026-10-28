import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { ReleasesController, ReleasesUc } from './api';
import { ReleasesModule } from './releases.module';

@Module({
	imports: [ReleasesModule, AuthorizationModule],
	controllers: [ReleasesController],
	providers: [ReleasesUc],
})
export class ReleasesApiModule {}
