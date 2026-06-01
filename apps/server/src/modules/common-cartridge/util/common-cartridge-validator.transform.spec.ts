import {
	CommonCartridgeValidatorTransform,
	CC_VALIDATION_ERROR_EVENT,
	CcValidationErrorType,
} from './common-cartridge-validator.transform';

describe(CommonCartridgeValidatorTransform.name, () => {
	describe('_transform', () => {
		describe('when maximum size of stream is exceeded', () => {
			const setup = () => {
				const maxSize = 10;
				const sut = new CommonCartridgeValidatorTransform(maxSize);

				const bufferBiggerThanMaxSize = Buffer.alloc(maxSize + 1, 'a');

				const eventSpy = jest.fn();
				const callback = jest.fn();

				return { sut, bufferBiggerThanMaxSize, eventSpy, callback };
			};

			it('should emit a MaximumSizeExceeded validation error event', () => {
				const { sut, bufferBiggerThanMaxSize, eventSpy, callback } = setup();

				sut.on(CC_VALIDATION_ERROR_EVENT, eventSpy);
				sut._transform(bufferBiggerThanMaxSize, 'utf8', callback);

				expect(eventSpy).toHaveBeenCalledWith(CcValidationErrorType.MaximumSizeExceeded);
				expect(callback).toHaveBeenCalled();
			});
		});

		describe('when zip magic number length is reached and magic number is not found', () => {
			const setup = () => {
				const sut = new CommonCartridgeValidatorTransform(100);

				const buffer = Buffer.alloc(50, 'a');

				const eventSpy = jest.fn();
				const callback = jest.fn();

				return { sut, buffer, eventSpy, callback };
			};

			it('should emit a NotAZipFile validation error event', () => {
				const { sut, buffer, eventSpy, callback } = setup();

				sut.on(CC_VALIDATION_ERROR_EVENT, eventSpy);
				sut._transform(buffer, 'utf8', callback);

				expect(eventSpy).toHaveBeenCalledWith(CcValidationErrorType.NotAZipFile);
				expect(callback).toHaveBeenCalled();
			});

			it('should short-circuit and only emit the event once', () => {
				const { sut, buffer, eventSpy, callback } = setup();

				sut.on(CC_VALIDATION_ERROR_EVENT, eventSpy);
				sut._transform(buffer, 'utf8', callback);
				sut._transform(buffer, 'utf8', callback);

				expect(eventSpy).toHaveBeenCalledWith(CcValidationErrorType.NotAZipFile);
				expect(eventSpy).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledTimes(2);
			});
		});

		describe('when zip magic number is found', () => {
			const setup = () => {
				const sut = new CommonCartridgeValidatorTransform(100);

				const bufferWithZipMagicNumber = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]);

				const eventSpy = jest.fn();
				const callback = jest.fn();

				return { sut, bufferWithZipMagicNumber, eventSpy, callback };
			};

			it('should not emit a validation error event', () => {
				const { sut, bufferWithZipMagicNumber, eventSpy, callback } = setup();

				sut.on(CC_VALIDATION_ERROR_EVENT, eventSpy);
				sut._transform(bufferWithZipMagicNumber, 'utf8', callback);

				expect(eventSpy).not.toHaveBeenCalled();
				expect(callback).toHaveBeenCalled();
			});
		});
	});

	describe('_flush', () => {
		describe('when zip magic number has not been found when _flush is called', () => {
			const setup = () => {
				const sut = new CommonCartridgeValidatorTransform(100);

				const eventSpy = jest.fn();
				const callback = jest.fn();

				return { sut, eventSpy, callback };
			};

			it('should emit a NotAZipFile validation error event', () => {
				const { sut, eventSpy, callback } = setup();

				sut.on(CC_VALIDATION_ERROR_EVENT, eventSpy);
				sut._flush(callback);

				expect(eventSpy).toHaveBeenCalledWith(CcValidationErrorType.NotAZipFile);
				expect(callback).toHaveBeenCalled();
			});
		});
	});
});
