import { AuthorizationModule } from '@modules/authorization';
import { SystemController } from '@modules/system/controller/system.controller';
import { SystemUc } from '@modules/system/uc/system.uc';
import { Module } from '@nestjs/common';
import { SystemModule } from './system.module';

@Module({
	imports: [SystemModule, AuthorizationModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
