import { Base64SignatureUtil } from './base64-signature.util';

describe(Base64SignatureUtil.name, () => {
	describe('detectLogoImageType', () => {
		describe('when unsupported image type', () => {
			it('should return undefined', () => {
				const result = Base64SignatureUtil.detectLogoImageType('unsupportedImageType');

				expect(result).toBeUndefined();
			});
		});

		describe('when valid base64 image', () => {
			it('should return the content type', () => {
				const result = Base64SignatureUtil.detectLogoImageType('iVBORw0KGgoAAAANSUhEUgAAAAUA');

				expect(result).toBe('image/png');
			});
		});
	});
});
