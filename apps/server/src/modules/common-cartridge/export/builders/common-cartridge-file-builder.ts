import { PassThrough } from 'stream';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { MissingMetadataLoggableException } from '../errors';
import { CommonCartridgeElement } from '../interfaces';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeFileResourceV110 } from '../resources/v1.1.0/common-cartridge-file-resource';
import { CommonCartridgeFileResourceV130 } from '../resources/v1.3.0/common-cartridge-file-resource';
import {
	CommonCartridgeOrganizationNode,
	CommonCartridgeOrganizationNodeProps,
} from './common-cartridge-organization-node';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';

import { Logger } from '@core/logger';
import { CommonCartridgeExportMessageLoggable } from '../../loggable/common-cartridge-export-message.loggable';
import archiver from 'archiver';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export type CommonCartridgeOrganizationProps = Omit<CommonCartridgeOrganizationNodeProps, 'version' | 'type'>;

export class CommonCartridgeFileBuilder {
	private readonly resourcesBuilder: CommonCartridgeResourceCollectionBuilder =
		new CommonCartridgeResourceCollectionBuilder();

	private readonly organizationsRoot: CommonCartridgeOrganizationNode[] = [];

	private metadataElement: CommonCartridgeElement | null = null;

	constructor(private readonly props: CommonCartridgeFileBuilderProps, public readonly archive: archiver.Archiver) {}

	public addMetadata(metadataProps: CommonCartridgeElementProps): void {
		this.metadataElement = CommonCartridgeElementFactory.createElement({
			version: this.props.version,
			...metadataProps,
		});
	}

	public createOrganization(organizationProps: CommonCartridgeOrganizationProps): CommonCartridgeOrganizationNode {
		const organization = new CommonCartridgeOrganizationNode(
			{ ...organizationProps, version: this.props.version, type: CommonCartridgeElementType.ORGANIZATION },
			this.resourcesBuilder,
			null
		);

		this.organizationsRoot.push(organization);

		return organization;
	}

	public build(logger: Logger): void {
		logger.debug(new CommonCartridgeExportMessageLoggable('Building archive'));
		if (!this.metadataElement) {
			throw new MissingMetadataLoggableException();
		}

		const organizations = this.organizationsRoot.map((organization) => organization.build());
		logger.debug(new CommonCartridgeExportMessageLoggable('Built organizations of archive'));

		const resources = this.resourcesBuilder.build();
		logger.debug(new CommonCartridgeExportMessageLoggable('Built resources of archive'));

		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadataElement,
			organizations,
			resources,
		});

		this.archive.append(Buffer.from(manifest.getFileContent()), { name: manifest.getFilePath() });

		logger.debug(new CommonCartridgeExportMessageLoggable('Adding resources'));
		resources.forEach((resource) => {
			if (resource instanceof CommonCartridgeFileResourceV130 || resource instanceof CommonCartridgeFileResourceV110) {
				logger.debug(new CommonCartridgeExportMessageLoggable(`FileResource: ${resource.getFilePath()}`));

				const passthrough = resource.getFileStream().pipe(new PassThrough());
				this.archive.append(passthrough, { name: resource.getFilePath() });

				logger.debug(new CommonCartridgeExportMessageLoggable(`Appended: ${resource.getFilePath()}`));
			} else {
				logger.debug(new CommonCartridgeExportMessageLoggable(`NonFileResource: ${resource.getFilePath()}`));

				const fileContent = resource.getFileContent();
				const buffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);
				this.archive.append(buffer, { name: resource.getFilePath() });

				logger.debug(new CommonCartridgeExportMessageLoggable(`Appended: ${resource.getFilePath()}`));
			}
		});

		logger.debug(new CommonCartridgeExportMessageLoggable('Finalizing archive'));
		// DO NOT AWAIT THE PROMISE OR THIS DOESN'T WORK
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.archive.finalize();
		logger.debug(new CommonCartridgeExportMessageLoggable('Built archive'));
	}
}
