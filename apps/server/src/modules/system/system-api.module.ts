import { Module } from '@nestjs/common';
import { SystemController } from './controller/system.controller';
import { SystemModule } from './system.module';
import { SystemUc } from './uc/system.uc';

@Module({
	imports: [SystemModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
