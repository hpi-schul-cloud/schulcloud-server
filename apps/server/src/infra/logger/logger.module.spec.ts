import { Test, type TestingModule } from '@nestjs/testing';
import { AuditLogger } from './audit-logger';
import { ErrorLogger } from './error-logger';
import { LegacyLogger } from './legacy-logger.service';
import { Logger } from './logger';
import { LoggerModule } from './logger.module';

describe(LoggerModule.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [LoggerModule],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should provide all loggers', async () => {
		expect(await module.resolve(Logger)).toBeInstanceOf(Logger);
		expect(await module.resolve(LegacyLogger)).toBeInstanceOf(LegacyLogger);
		expect(await module.resolve(AuditLogger)).toBeInstanceOf(AuditLogger);
		expect(await module.resolve(ErrorLogger)).toBeInstanceOf(ErrorLogger);
	});
});
