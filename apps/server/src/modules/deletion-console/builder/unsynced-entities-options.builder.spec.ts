import { ObjectId } from 'bson';
import { UnsyncedEntitiesOptions } from '../interface';
import { UnsyncedEntitiesOptionsBuilder } from './unsynced-entities-options.builder';

describe(UnsyncedEntitiesOptionsBuilder.name, () => {
	describe(UnsyncedEntitiesOptionsBuilder.build.name, () => {
		describe('when called with valid arguments', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const unsyncedForMinutes = 3600;
				const targetRefDomain = 'school';
				const deleteInMinutes = 43200;
				const callsDelayMs = 100;

				const expectedOutput: UnsyncedEntitiesOptions = {
					systemId,
					unsyncedForMinutes,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs,
				};

				return {
					systemId,
					unsyncedForMinutes,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs,
					expectedOutput,
				};
			};

			it('should return valid options object with expected values', () => {
				const { systemId, unsyncedForMinutes, targetRefDomain, deleteInMinutes, callsDelayMs, expectedOutput } =
					setup();

				const output = UnsyncedEntitiesOptionsBuilder.build(
					systemId,
					unsyncedForMinutes,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs
				);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
