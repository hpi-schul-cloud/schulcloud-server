import { Embeddable, Embedded, Entity, JsonType, Property } from '@mikro-orm/core';
import { IContentMetadata, ILibraryName } from '@lumieducation/h5p-server';
import { BaseEntity } from '@shared/domain';
import { IContentAuthor, IContentChange } from '@lumieducation/h5p-server/build/src/types';

@Embeddable()
export class ContentMetadata implements IContentMetadata {
	@Property({ nullable: true })
	dynamicDependencies?: ILibraryName[];

	@Property({ nullable: true })
	editorDependencies?: ILibraryName[];

	@Property()
	embedTypes: ('iframe' | 'div')[];

	@Property({ nullable: true })
	h?: string;

	@Property()
	language: string;

	@Property()
	mainLibrary: string;

	@Property({ nullable: true })
	metaDescription?: string;

	@Property({ nullable: true })
	metaKeywords?: string;

	@Property()
	preloadedDependencies: ILibraryName[];

	@Property({ nullable: true })
	w?: string;

	@Property()
	defaultLanguage: string;

	@Property({ nullable: true })
	a11yTitle?: string;

	@Property()
	license: string;

	@Property({ nullable: true })
	licenseVersion?: string;

	@Property({ nullable: true })
	yearFrom?: string;

	@Property({ nullable: true })
	yearTo?: string;

	@Property({ nullable: true })
	source?: string;

	@Property()
	title: string;

	@Property({ nullable: true })
	authors?: IContentAuthor[];

	@Property({ nullable: true })
	licenseExtras?: string;

	@Property({ nullable: true })
	changes?: IContentChange[];

	@Property({ nullable: true })
	authorComments?: string;

	@Property({ nullable: true })
	contentType?: string;

	constructor(metadata: IContentMetadata) {
		this.embedTypes = metadata.embedTypes;
		this.language = metadata.language;
		this.mainLibrary = metadata.mainLibrary;
		this.defaultLanguage = metadata.defaultLanguage;
		this.license = metadata.license;
		this.title = metadata.title;
		this.preloadedDependencies = metadata.preloadedDependencies;

		this.dynamicDependencies = metadata.dynamicDependencies;
		this.editorDependencies = metadata.editorDependencies;
		this.h = metadata.h;
		this.metaDescription = metadata.metaDescription;
		this.metaKeywords = metadata.metaKeywords;
		this.w = metadata.w;
		this.a11yTitle = metadata.a11yTitle;
		this.licenseVersion = metadata.licenseVersion;
		this.yearFrom = metadata.yearFrom;
		this.yearTo = metadata.yearTo;
		this.source = metadata.source;
		this.authors = metadata.authors;
		this.licenseExtras = metadata.licenseExtras;
		this.changes = metadata.changes;
		this.authorComments = metadata.authorComments;
		this.contentType = metadata.contentType;
	}
}

@Entity({ tableName: 'h5p-editor-content' })
export class H5PContent extends BaseEntity {
	@Embedded(() => ContentMetadata)
	metadata: ContentMetadata;

	@Property({ type: JsonType })
	content: unknown;

	constructor({ metadata, content }: { metadata: ContentMetadata; content: unknown }) {
		super();

		this.metadata = metadata;
		this.content = content;
	}
}
