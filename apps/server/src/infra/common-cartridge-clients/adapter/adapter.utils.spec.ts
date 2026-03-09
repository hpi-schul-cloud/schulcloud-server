import { faker } from '@faker-js/faker';
import { AdapterUtils } from './adapter.utils';

describe(AdapterUtils.name, () => {
	describe('createAxiosConfigForJwt', () => {
		it('should create axios config with jwt as Authorization header', () => {
			const jwt = faker.internet.jwt();
			const config = AdapterUtils.createAxiosConfigForJwt(jwt);

			expect(config).toStrictEqual({
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});
		});
	});
});
