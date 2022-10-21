import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing/index';
import { CourseExternalTool } from '@shared/domain';
import { courseExternalToolFactory } from '@shared/testing/factory/course-external-tool.factory';

describe('ExternalTool Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseExternalTool();
			expect(test).toThrow();
		});

		it('should create an external course Tool by passing required properties', () => {
			const courseExternalTool: CourseExternalTool = courseExternalToolFactory.buildWithId();
			expect(courseExternalTool instanceof CourseExternalTool).toEqual(true);
		});
	});
});
