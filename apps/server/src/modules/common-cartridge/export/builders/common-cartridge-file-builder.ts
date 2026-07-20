import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	type CommonCartridgeVersion,
} from '../common-cartridge.enums';
import {
	CommonCartridgeElementFactory,
	type CommonCartridgeElementProps,
} from '../elements/common-cartridge-element-factory';
import { MissingMetadataLoggableException } from '../errors';
import { type CommonCartridgeElement } from '../interfaces';
import { CommonCartridgeResourceFactory } from '../resources/common-cartridge-resource-factory';
import { CommonCartridgeOrganizationNode } from './common-cartridge-organization-node';
import type { CommonCartridgeOrganizationProps } from './common-cartridge-organization.types';
import { CommonCartridgeResourceCollectionBuilder } from './common-cartridge-resource-collection-builder';

import { type Logger } from '@infra/logger';
import type archiver from 'archiver';
import { CommonCartridgeMessageLoggable } from '../../loggable/common-cartridge-message.loggable';
import { type ResourceFileContent } from '../interfaces/common-cartridge-resource.interface';

export type CommonCartridgeFileBuilderProps = {
	version: CommonCartridgeVersion;
	identifier: string;
};

export class CommonCartridgeFileBuilder {
	private readonly resourcesBuilder: CommonCartridgeResourceCollectionBuilder =
		new CommonCartridgeResourceCollectionBuilder();

	private readonly organizationsRoot: CommonCartridgeOrganizationNode[] = [];

	private metadataElement: CommonCartridgeElement | null = null;

	constructor(
		private readonly props: CommonCartridgeFileBuilderProps,
		public readonly archive: archiver.Archiver,
		private readonly logger: Logger
	) {}

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

	public build(): void {
		if (!this.metadataElement) {
			throw new MissingMetadataLoggableException();
		}

		this.logger.debug(new CommonCartridgeMessageLoggable('Building archive'));

		const organizations = this.organizationsRoot.map((organization) => organization.build());
		this.logger.debug(new CommonCartridgeMessageLoggable('Built organizations of archive'));

		const resources = this.resourcesBuilder.build();
		this.logger.debug(new CommonCartridgeMessageLoggable('Built resources of archive'));

		const manifest = CommonCartridgeResourceFactory.createResource({
			type: CommonCartridgeResourceType.MANIFEST,
			version: this.props.version,
			identifier: this.props.identifier,
			metadata: this.metadataElement,
			organizations,
			resources,
		});

		this.writeFileContents(manifest.getFileContent());

		this.logger.debug(new CommonCartridgeMessageLoggable('Adding resources'));
		resources.forEach((resource) => {
			const fileContent = resource.getFileContent();
			this.writeFileContents(fileContent);
		});

		this.logger.debug(new CommonCartridgeMessageLoggable('Finalizing archive'));
		// DO NOT AWAIT THE PROMISE OR THIS DOESN'T WORK
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.archive.finalize();
		this.logger.debug(new CommonCartridgeMessageLoggable('Built archive'));
	}

	private writeFileContents(fileContent: ResourceFileContent | ResourceFileContent[]): void {
		if (Array.isArray(fileContent)) {
			fileContent.forEach((element) => this.writeFileContent(element));
		} else {
			this.writeFileContent(fileContent);
		}
	}

	private writeFileContent(fileContent: ResourceFileContent): void {
		this.logger.debug(new CommonCartridgeMessageLoggable(`Appending file: ${fileContent.path}`));

		this.archive.append(fileContent.content, { name: fileContent.path });

		this.logger.debug(new CommonCartridgeMessageLoggable(`Appended: ${fileContent.path}`));
	}
}
