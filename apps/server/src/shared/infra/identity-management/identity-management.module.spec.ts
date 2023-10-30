import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '../database/mongo-memory-database/mongo-memory-database.module';
import { IdentityManagementModule } from './identity-management.module';
import { IdentityManagementService } from './identity-management.service';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				IdentityManagementModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
		}).compile();
		idm = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined identity management.', () => {
		expect(idm).toBeDefined();
	});
});
