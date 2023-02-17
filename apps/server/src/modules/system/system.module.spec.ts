import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SystemService } from './service/system.service';
import { SystemModule } from './system.module';
import { SystemUc } from './uc/system.uc';

describe('SystemModule', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let systemService: SystemService;

	beforeAll(async () => {
		try {
			module = await Test.createTestingModule({
				imports: [
					SystemModule,
					MongoMemoryDatabaseModule.forRoot(),
					ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
				],
			}).compile();
			systemService = module.get(SystemService);
			systemUc = module.get(SystemUc);
		} catch (e) {
			console.log(e);
		}
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the system UC defined', () => {
		expect(systemUc).toBeDefined();
	});

	it('should have the system service defined', () => {
		expect(systemService).toBeDefined();
	});
});
