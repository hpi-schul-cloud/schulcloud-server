import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SystemController } from './controller';
import { SystemModule } from './system.module';
import { SystemUc } from './uc/system.uc';

@Module({
	imports: [CqrsModule, SystemModule, AuthorizationModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
