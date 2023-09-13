import { Module } from '@nestjs/common';
import { GroupController } from './controller';
import { GroupModule } from './group.module';
import { GroupUc } from './uc';

@Module({
	imports: [GroupModule],
	controllers: [GroupController],
	providers: [GroupUc],
})
export class GroupApiModule {}
