import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { readFile } from 'fs/promises';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

describe('CommonCartridgeImportService', () => {
	let orm: MikroORM;
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportService;

	beforeEach(async () => {
		orm = await setupEntities();
		moduleRef = await Test.createTestingModule({
			providers: [CommonCartridgeImportService],
		}).compile();

		sut = moduleRef.get<CommonCartridgeImportService>(CommonCartridgeImportService);
	});

	afterAll(async () => {
		await moduleRef.close();
		await orm.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createCourse', () => {
		describe('when the common cartridge is valid', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const buffer = await readFile(
					'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
				);

				return { user, buffer };
			};

			it('should return course with name from the common cartridge file', async () => {
				const { user, buffer } = await setup();

				const result = sut.createCourse(user, buffer);

				expect(result.name).toBe('201510-AMH-2020-70C-12218-US History Since 1877');
			});

			it('should return course with teachers set', async () => {
				const { user, buffer } = await setup();

				const result = sut.createCourse(user, buffer);

				expect(result.teachers).toHaveLength(1);
				expect(result.teachers[0]).toStrictEqual(user);
			});

			it('should return course with school set', async () => {
				const { user, buffer } = await setup();

				const result = sut.createCourse(user, buffer);

				expect(result.school).toStrictEqual(user.school);
			});
		});
	});
});
