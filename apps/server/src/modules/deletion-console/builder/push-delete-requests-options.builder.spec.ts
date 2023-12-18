import { PushDeletionRequestsOptions } from '../interface';
import { PushDeleteRequestsOptionsBuilder } from './push-delete-requests-options.builder';

describe(PushDeleteRequestsOptionsBuilder.name, () => {
	describe(PushDeleteRequestsOptionsBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const refsFilePath = '/tmp/ids.txt';
				const targetRefDomain = 'school';
				const deleteInMinutes = 43200;
				const callsDelayMs = 100;

				const expectedOutput: PushDeletionRequestsOptions = {
					refsFilePath,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs,
				};

				return {
					refsFilePath,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs,
					expectedOutput,
				};
			};

			it('should return valid object with expected values', () => {
				const { refsFilePath, targetRefDomain, deleteInMinutes, callsDelayMs, expectedOutput } = setup();

				const output = PushDeleteRequestsOptionsBuilder.build(
					refsFilePath,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs
				);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
