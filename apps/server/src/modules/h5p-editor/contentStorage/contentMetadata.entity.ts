import { Entity, Property } from '@mikro-orm/core';
import { IContentMetadata, IFileStats, ILibraryName } from '@lumieducation/h5p-server';
import { BaseEntity } from '@shared/domain';
import { IContentAuthor, IContentChange } from '@lumieducation/h5p-server/build/src/types';

@Entity({ tableName: 'h5p-editor-temp-file' })
export class ContentMetadata extends BaseEntity implements IContentMetadata, IFileStats {
	@Property()
	birthtime: Date;

	@Property()
	size: number;

	@Property()
	embedTypes: ('iframe' | 'div')[];

	@Property()
	language: string;

	@Property()
	mainLibrary: string;

	@Property()
	defaultLanguage: string;

	@Property()
	license: string;

	@Property()
	title: string;

	@Property()
	preloadedDependencies: ILibraryName[];

	@Property()
	dynamicDependencies?: ILibraryName[] | undefined;

	@Property()
	editorDependencies?: ILibraryName[] | undefined;

	@Property()
	h?: string | undefined;

	@Property()
	metaDescription?: string | undefined;

	@Property()
	metaKeywords?: string | undefined;

	@Property()
	w?: string | undefined;

	@Property()
	a11yTitle?: string | undefined;

	@Property()
	licenseVersion?: string | undefined;

	@Property()
	yearFrom?: string | undefined;

	@Property()
	yearTo?: string | undefined;

	@Property()
	source?: string | undefined;

	@Property()
	authors?: IContentAuthor[] | undefined;

	@Property()
	licenseExtras?: string | undefined;

	@Property()
	changes?: IContentChange[] | undefined;

	@Property()
	authorComments?: string | undefined;

	@Property()
	contentType?: string | undefined;

	constructor(
		birthtime: Date,
		size: number,
		embedTypes: ('iframe' | 'div')[],
		language: string,
		mainLibrary: string,
		defaultLanguage: string,
		license: string,
		title: string,
		preloadedDependencies: ILibraryName[],
		dynamicDependencies?: ILibraryName[] | undefined,
		editorDependencies?: ILibraryName[] | undefined,
		h?: string | undefined,
		metaDescription?: string | undefined,
		metaKeywords?: string | undefined,
		w?: string | undefined,
		a11yTitle?: string | undefined,
		licenseVersion?: string | undefined,
		yearFrom?: string | undefined,
		yearTo?: string | undefined,
		source?: string | undefined,
		authors?: IContentAuthor[] | undefined,
		licenseExtras?: string | undefined,
		changes?: IContentChange[] | undefined,
		authorComments?: string | undefined,
		contentType?: string | undefined
	) {
		super();
		this.birthtime = birthtime;
		this.size = size;

		this.embedTypes = embedTypes;
		this.language = language;
		this.mainLibrary = mainLibrary;
		this.defaultLanguage = defaultLanguage;
		this.license = license;
		this.title = title;
		this.preloadedDependencies = preloadedDependencies;

		this.dynamicDependencies = dynamicDependencies;
		this.editorDependencies = editorDependencies;
		this.h = h;
		this.metaDescription = metaDescription;
		this.metaKeywords = metaKeywords;
		this.w = w;
		this.a11yTitle = a11yTitle;
		this.licenseVersion = licenseVersion;
		this.yearFrom = yearFrom;
		this.yearTo = yearTo;
		this.source = source;
		this.authors = authors;
		this.licenseExtras = licenseExtras;
		this.changes = changes;
		this.authorComments = authorComments;
		this.contentType = contentType;
	}
}
