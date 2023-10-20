import { Module } from '@nestjs/common';
import { SystemController } from '@modules/system/controller/system.controller';
import { SystemUc } from '@modules/system/uc/system.uc';
import { SystemModule } from './system.module';

@Module({
	imports: [SystemModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
