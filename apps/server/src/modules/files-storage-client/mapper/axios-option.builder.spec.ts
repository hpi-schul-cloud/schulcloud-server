import { MikroORM } from '@mikro-orm/core';
import { setupEntities, taskFactory } from '@shared/testing';
import { AxiosJWTOptionBuilder } from './axios-option.builder';
import { FileParamBuilder } from './files-storage-param.builder';

describe('AxiosOptionBuilder', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should build valid axios request config options', () => {
		const jwt = 'jwt';
		const task = taskFactory.buildWithId();

		const fileRquestInfo = FileParamBuilder.build(jwt, '123', task);
		const result = AxiosJWTOptionBuilder.build(fileRquestInfo);

		const expectedResult = {
			headers: { Authorization: `Bearer ${jwt}` },
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
