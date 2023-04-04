import { Module } from '@nestjs/common';
import { SystemController } from '@src/modules/system/controller/system.controller';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemModule } from './system.module';

@Module({
	imports: [SystemModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
