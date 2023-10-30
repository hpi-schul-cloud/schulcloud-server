import { DynamicModule, Module } from '@nestjs/common';
import { Account } from '@shared/domain/entity/account.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { User } from '@shared/domain/entity/user.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database/mongo-memory-database/mongo-memory-database.module';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { CoreModule } from '@src/core/core.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthenticationApiModule } from '../authentication/authentication-api.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { H5PEditorModule } from './h5p-editor.module';

const imports = [
	H5PEditorModule,
	MongoMemoryDatabaseModule.forRoot({ entities: [Account, Role, SchoolEntity, SchoolYearEntity, User] }),
	AuthenticationApiModule,
	AuthorizationModule,
	AuthenticationModule,
	CoreModule,
	LoggerModule,
	RabbitMQWrapperTestModule,
];
const controllers = [];
const providers = [];
@Module({
	imports,
	controllers,
	providers,
})
export class H5PEditorTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: H5PEditorTestModule,
			imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...options })],
			controllers,
			providers,
		};
	}
}
