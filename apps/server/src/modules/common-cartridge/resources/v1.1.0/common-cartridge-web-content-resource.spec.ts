import { faker } from '@faker-js/faker';
import {
	CommonCartridgeIntendedUseType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../../learnroom/common-cartridge/common-cartridge.enums';
import {
	CommonCartridgeWebContentResourcePropsV110,
	CommonCartridgeWebContentResourceV110,
} from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResourceV110', () => {
	const setup = () => {
		const props: CommonCartridgeWebContentResourcePropsV110 = {
			type: CommonCartridgeResourceType.WEB_CONTENT,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: faker.lorem.words(),
			html: faker.lorem.paragraph(),
			intendedUse: CommonCartridgeIntendedUseType.UNSPECIFIED,
		};
		const sut = new CommonCartridgeWebContentResourceV110(props);

		return { sut, props };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the constructed file path', () => {
				const { sut, props } = setup();
				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		it('should return the HTML', () => {
			const { sut, props } = setup();
			const result = sut.getFileContent();

			expect(result).toBe(props.html);
		});
	});

	describe('getSupportedVersion', () => {
		it('should return Common Cartridge version 1.1.0', () => {
			const { sut } = setup();
			const result = sut.getSupportedVersion();

			expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
		});
	});

	describe('getManifestXmlObject', () => {
		it('should return the correct XML object', () => {
			const { sut, props } = setup();
			const result = sut.getManifestXmlObject();

			expect(result).toEqual({
				$: {
					identifier: props.identifier,
					type: 'webcontent',
					intendeduse: props.intendedUse,
				},
				file: {
					$: {
						href: sut.getFilePath(),
					},
				},
			});
		});
	});
});
