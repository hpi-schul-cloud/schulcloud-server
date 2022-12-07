import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules';

@Module({
	imports: [AuthorizationModule],
	controllers: [],
	providers: [],
	exports: [],
})
export class TaskCardModule {}
