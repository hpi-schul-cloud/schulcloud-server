import { DynamicModule, Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule, MongoDatabaseModuleOptions } from '@infra/database';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { AuthorizationModule } from '@modules/authorization';
import { Course, User } from '@shared/domain/entity';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { TldrawWsModule } from './tldraw-ws.module';
import { TldrawWs } from './controller';
import { TldrawBoardRepo } from './repo';
import { TldrawWsService } from './service';

const imports = [
	TldrawWsModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [User, Course] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
];
const providers = [TldrawWs, TldrawBoardRepo, TldrawWsService];
@Module({
	imports,
	providers,
})
export class TldrawTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: TldrawTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			providers,
		};
	}
}
