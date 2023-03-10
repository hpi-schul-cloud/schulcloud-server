import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemOidcService } from './service/system-oidc.service';
import { SystemService } from './service/system.service';
import { SystemModule } from './system.module';
import { SystemUc } from './uc/system.uc';

describe('SystemModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				SystemModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the system UC defined', () => {
		const systemUc = module.get(SystemUc);
		expect(systemUc).toBeDefined();
	});

	it('should have the system service defined', () => {
		const systemService = module.get(SystemService);
		expect(systemService).toBeDefined();
	});

	it('should have the oidc system service defined', () => {
		const systemOidcService = module.get(SystemOidcService);
		expect(systemOidcService).toBeDefined();
	});
});
