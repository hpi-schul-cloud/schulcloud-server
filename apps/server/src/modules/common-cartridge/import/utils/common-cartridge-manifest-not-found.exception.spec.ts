import { CommonCartridgeManifestNotFoundException } from './common-cartridge-manifest-not-found.exception';

describe('CommonCartridgeManifestNotFoundException', () => {
	describe('getLogMessage', () => {
		describe('when returning a message', () => {
			const setup = () => {
				const sut = new CommonCartridgeManifestNotFoundException();

				return { sut };
			};

			it('should contain the type', () => {
				const { sut } = setup();

				const result = sut.getLogMessage();

				expect(result.type).toEqual('WRONG_FILE_FORMAT');
			});

			it('should contain the stack', () => {
				const { sut } = setup();

				const result = sut.getLogMessage();

				expect(result.stack).toEqual(sut.stack);
			});
		});
	});
});
