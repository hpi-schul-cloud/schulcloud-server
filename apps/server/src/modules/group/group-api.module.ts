import { Module } from '@nestjs/common';
import { GroupModule } from './group.module';

@Module({
	imports: [GroupModule],
})
export class GroupApiModule {}
