import { ObjectId } from 'bson';
import { SystemType, UsersSyncOptions } from '../interface';
import { UsersSyncOptionsBuilder } from './users-sync-options.builder';

describe(UsersSyncOptionsBuilder.name, () => {
	describe(UsersSyncOptionsBuilder.build.name, () => {
		describe('when called with valid arguments', () => {
			const setup = () => {
				const systemType = SystemType.MOIN_SCHULE;
				const systemId = new ObjectId().toHexString();

				const expectedOutput: UsersSyncOptions = { systemType, systemId };

				return { systemType, systemId, expectedOutput };
			};

			it('should return valid options object with expected values', () => {
				const { systemType, systemId, expectedOutput } = setup();

				const output = UsersSyncOptionsBuilder.build(systemType, systemId);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
