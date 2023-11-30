import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeLtiResource } from './common-cartridge-lti-resource';
import { CommonCartridgeResourceFactory, CommonCartridgeResourceProps } from './common-cartridge-resource-factory';
import { CommonCartridgeWebContentResource } from './common-cartridge-web-content-resource';
import { CommonCartridgeWebLinkResource } from './common-cartridge-web-link-resource';

describe('CommonCartridgeResourceFactory', () => {
	const versionAndFolderProps = { version: CommonCartridgeVersion.V_1_1, folder: 'folder' };

	describe('create', () => {
		// AI next 14 lines
		describe('when creating a lti resource', () => {
			it('should return a lti resource', () => {
				const props: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceType.LTI,
					identifier: 'lti-identifier',
					title: 'title',
					description: 'description',
					url: 'url',
				};

				const resource = CommonCartridgeResourceFactory.create({ ...props, ...versionAndFolderProps });

				expect(resource).toBeInstanceOf(CommonCartridgeLtiResource);
			});
		});

		// AI next 13 lines
		describe('when creating a web content resource', () => {
			it('should return a web content resource', () => {
				const props: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceType.WEB_CONTENT,
					identifier: 'web-content-identifier',
					title: 'title',
					html: 'html',
				};

				const resource = CommonCartridgeResourceFactory.create({ ...props, ...versionAndFolderProps });

				expect(resource).toBeInstanceOf(CommonCartridgeWebContentResource);
			});
		});

		// AI next 13 lines
		describe('when creating a web link resource', () => {
			it('should return a web link resource', () => {
				const props: CommonCartridgeResourceProps = {
					type: CommonCartridgeResourceType.WEB_LINK,
					identifier: 'web-link-identifier',
					title: 'title',
					url: 'url',
				};

				const resource = CommonCartridgeResourceFactory.create({ ...props, ...versionAndFolderProps });

				expect(resource).toBeInstanceOf(CommonCartridgeWebLinkResource);
			});
		});
	});
});
