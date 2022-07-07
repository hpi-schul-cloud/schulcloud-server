import { AxiosJWTOptionBuilder } from './axios-option.builder';
import { FileParamBuilder } from './files-storage-param.builder';

describe('AxiosOptionBuilder', () => {
	it('should build valid axios request config options', () => {
		const jwt = 'jwt';

		const fileRquestInfo = FileParamBuilder.buildForTask(jwt, '123', '123');
		const result = AxiosJWTOptionBuilder.build(fileRquestInfo);

		const expectedResult = {
			headers: { Authorization: `Bearer ${jwt}` },
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
