import { Logger } from '@core/logger';
import {
	cacheImplementations,
	ContentTypeCache,
	H5PConfig,
	ILibraryAdministrationOverviewItem,
	IUser,
	LibraryAdministration,
	LibraryManager,
} from '@lumieducation/h5p-server';
import ContentManager from '@lumieducation/h5p-server/build/src/ContentManager';
import ContentTypeInformationRepository from '@lumieducation/h5p-server/build/src/ContentTypeInformationRepository';
import { IHubContentType, ILibraryInstallResult } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { components } from '@octokit/openapi-types';
import { Octokit } from '@octokit/rest';
import AdmZip from 'adm-zip';
import axios, { AxiosResponse } from 'axios';
import { createWriteStream, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';
import {
	H5PLibraryManagementErrorLoggable,
	H5PLibraryManagementLoggable,
	H5PLibraryManagementMetricsLoggable,
} from '../loggable';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';
import LibraryManagementPermissionSystem from './library-management-permission-system';

const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
	installLibraryLockMaxOccupationTime: 30000,
});

interface LibrariesContentType {
	h5p_libraries: string[];
}

function isLibrariesContentType(object: unknown): object is LibrariesContentType {
	const isType =
		typeof object === 'object' &&
		!Array.isArray(object) &&
		object !== null &&
		'h5p_libraries' in object &&
		Array.isArray(object.h5p_libraries);

	return isType;
}

export const castToLibrariesContentType = (object: unknown): LibrariesContentType => {
	if (!isLibrariesContentType(object)) {
		throw new InternalServerErrorException('Invalid input type for castToLibrariesContentType');
	}

	return object;
};

@Injectable()
export class H5PLibraryManagementService {
	// should all this prop private?
	contentTypeCache: ContentTypeCache;

	contentTypeRepo: ContentTypeInformationRepository;

	libraryManager: LibraryManager;

	libraryAdministration: LibraryAdministration;

	libraryWishList: string[];

	constructor(
		private readonly libraryStorage: LibraryStorage,
		private readonly contentStorage: ContentStorage,
		private readonly configService: ConfigService<IH5PLibraryManagementConfig, true>,
		private readonly logger: Logger
	) {
		const kvCache = new cacheImplementations.CachedKeyValueStorage('kvcache');
		this.contentTypeCache = new ContentTypeCache(h5pConfig, kvCache);
		this.libraryManager = new LibraryManager(
			this.libraryStorage,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			h5pConfig
		);
		const permissionSystem = new LibraryManagementPermissionSystem();
		this.contentTypeRepo = new ContentTypeInformationRepository(
			this.contentTypeCache,
			this.libraryManager,
			h5pConfig,
			permissionSystem
		);
		const contentManager = new ContentManager(this.contentStorage, permissionSystem);
		this.libraryAdministration = new LibraryAdministration(this.libraryManager, contentManager);
		const filePath = this.configService.get<string>('H5P_EDITOR__LIBRARY_LIST_PATH');

		const librariesYamlContent = readFileSync(filePath, { encoding: 'utf-8' });
		const librariesContentType = castToLibrariesContentType(parse(librariesYamlContent));
		this.libraryWishList = librariesContentType.h5p_libraries;

		this.logger.setContext(H5PLibraryManagementService.name);
	}

	public async uninstallUnwantedLibraries(wantedLibraries: string[]): Promise<ILibraryAdministrationOverviewItem[]> {
		let librariesToCheck: ILibraryAdministrationOverviewItem[] = [];
		let uninstalledLibraries: ILibraryAdministrationOverviewItem[];
		let allUninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];

		do {
			librariesToCheck = await this.libraryAdministration.getLibraries();
			uninstalledLibraries = await this.uninstallUnwantedLibrariesOnce(wantedLibraries, librariesToCheck);
			allUninstalledLibraries = [...allUninstalledLibraries, ...uninstalledLibraries];
		} while (uninstalledLibraries.length > 0);

		return allUninstalledLibraries;
	}

	private async uninstallUnwantedLibrariesOnce(
		wantedLibraries: string[],
		librariesToCheck: ILibraryAdministrationOverviewItem[]
	): Promise<ILibraryAdministrationOverviewItem[]> {
		if (librariesToCheck.length === 0) {
			return [];
		}

		const lastPositionLibrariesToCheckArray = librariesToCheck.length - 1;
		const libraryToBeUninstalled = librariesToCheck[lastPositionLibrariesToCheckArray];
		const libraryCanBeUninstalled =
			!wantedLibraries.includes(libraryToBeUninstalled.machineName) && libraryToBeUninstalled.dependentsCount === 0;

		if (libraryCanBeUninstalled) {
			// force removal, don't let content prevent it, therefore use libraryStorage directly
			// also to avoid conflicts, remove one-by-one, not using for-await:
			await this.libraryStorage.deleteLibrary(libraryToBeUninstalled);
		}

		const uninstalledLibraries = await this.uninstallUnwantedLibrariesOnce(
			wantedLibraries,
			librariesToCheck.slice(0, lastPositionLibrariesToCheckArray)
		);

		if (!libraryCanBeUninstalled) {
			return uninstalledLibraries;
		}

		const result = [libraryToBeUninstalled, ...uninstalledLibraries];

		return result;
	}

	private checkContentTypeExists(contentType: IHubContentType[]): void {
		if (contentType === undefined) {
			throw new NotFoundException('this library does not exist');
		}
	}

	private createDefaultIUser(): IUser {
		const user: IUser = {
			email: 'a@b.de',
			id: 'a',
			name: 'a',
			type: 'local',
		};

		return user;
	}

	public async installLibraries(librariesToInstall: string[]): Promise<ILibraryInstallResult[]> {
		if (librariesToInstall.length === 0) {
			return [];
		}
		const lastPositionLibrariesToInstallArray = librariesToInstall.length - 1;
		const libraryToBeInstalled = librariesToInstall[lastPositionLibrariesToInstallArray];
		// avoid conflicts, install one-by-one:
		const contentType = await this.contentTypeCache.get(libraryToBeInstalled);
		this.checkContentTypeExists(contentType);

		const user = this.createDefaultIUser();

		let installResults: ILibraryInstallResult[] = [];

		try {
			installResults = await this.contentTypeRepo.installContentType(libraryToBeInstalled, user);
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(libraryToBeInstalled, error));
		}

		const installedLibraries = await this.installLibraries(
			librariesToInstall.slice(0, lastPositionLibrariesToInstallArray)
		);

		const result = [...installResults, ...installedLibraries];

		return result;
	}

	public async run(): Promise<void> {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
		const availableLibraries = await this.libraryAdministration.getLibraries();
		const uninstalledLibraries = await this.uninstallUnwantedLibraries(this.libraryWishList);
		const installedLibraries = await this.installLibraries(this.libraryWishList);
		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(availableLibraries, uninstalledLibraries, installedLibraries)
		);

		// FEATURE FLAG!!!
		// ... Logging
		// library-1.0 already exits
		// start installation of library-2.0 ... finished installation of library-2.0

		// const map = await this.mapMachineNamesToGitHubRepos();

		const currentLibraries = await this.libraryAdministration.getLibraries();

		const availableVersions = currentLibraries
			.filter((lib) => {
				const [repoName] = this.mapMachineNameToGitHubRepo([lib.machineName]);

				return repoName;
			})
			.map((lib) => {
				const [repoName] = this.mapMachineNameToGitHubRepo([lib.machineName]);
				const version = `${repoName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`;

				return version;
			});

		const machineNames = currentLibraries.map((lib) => lib.machineName);
		const uniqueMachineNames = Array.from(new Set(machineNames));
		const githubRepos = this.mapMachineNameToGitHubRepo(uniqueMachineNames);

		const libraryTags = await this.fetchGitHubTags(githubRepos);
		for (const [library, tags] of Object.entries(libraryTags)) {
			const filteredTags = this.getHighestPatchTags(tags);
			for (const tag of filteredTags) {
				if (!availableVersions.includes(`${library}-${tag}`)) {
					await this.installLibraryTagFromGitHub(library, tag);
				} else {
					this.logger.info(
						new H5PLibraryManagementLoggable(`Library ${library} with tag ${tag} is already installed.`)
					);
				}
			}
		}
	}

	private async mapMachineNamesToGitHubRepos(): Promise<Record<string, string>> {
		const octokit = new Octokit({
			// Replace with your GitHub personal access token
			// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
		});
		const organization = 'h5p';
		const machineNameToRepoMap: Record<string, string> = {};

		try {
			// Fetch all repositories in the H5P organization with pagination
			const repos: components['schemas']['repository'][] = [];
			let page = 1;
			const perPage = 100; // Maximum allowed by GitHub API

			while (true) {
				const response = await octokit.repos.listForOrg({
					org: organization,
					type: 'public',
					per_page: perPage,
					page,
				});

				response.data.forEach((repo) => repos.push(repo as components['schemas']['repository']));

				if (response.data.length < perPage) {
					break; // Exit loop if there are no more pages
				}

				page++;
			}

			console.log(`Found ${repos.length} repositories in the ${organization} organization.`);

			for (const repo of repos) {
				try {
					// Check if library.json exists in the repository
					const response = await octokit.repos.getContent({
						owner: organization,
						repo: repo.name,
						path: 'library.json',
					});

					// Decode the content of library.json
					const libraryJsonContent = Buffer.from((response.data as any).content, 'base64').toString('utf-8');
					const libraryJson = JSON.parse(libraryJsonContent);

					if (libraryJson.machineName) {
						machineNameToRepoMap[libraryJson.machineName] = `${organization}/${repo.name}`;
					}
				} catch (error) {
					// Log if library.json does not exist or any other error occurs
					this.logger.warning(
						new H5PLibraryManagementErrorLoggable(
							repo.name,
							error instanceof Error ? error : new Error('Unknown error while processing library.json')
						)
					);
				}
			}
		} catch (error) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					organization,
					error instanceof Error ? error : new Error('Unknown error while fetching repositories')
				)
			);
		}

		return machineNameToRepoMap;
	}

	private mapMachineNameToGitHubRepo(libraries: string[]): string[] {
		const libraryRepoMap: Record<string, string> = {
			FontAwesome: 'h5p/font-awesome',
			'H5P.MultiChoice': 'h5p/h5p-multi-choice',
			'H5P.Flashcards': 'h5p/h5p-flashcards',
			'H5P.Image': 'h5p/h5p-image',
			'H5P.Text': 'h5p/h5p-text',
			'H5P.Video': 'h5p/h5p-video',
			'H5P.Table': 'h5p/h5p-table',
			'H5P.Audio': 'h5p/h5p-audio',
			flowplayer: 'h5p/flowplayer',
			'H5P.Blanks': 'h5p/h5p-blanks',
			'H5P.IFrameEmbed': 'h5p/h5p-iframe-embed',
			'H5P.Boardgame': 'h5p/h5p-boardgame',
			'H5P.QuestionSet': 'h5p/h5p-question-set',
			'H5P.ImageHotspots': 'h5p/h5p-image-hotspots',
			'H5P.MemoryGame': 'h5p/h5p-memory-game',
			'H5PEditor.VerticalTabs': 'h5p/h5p-editor-vertical-tabs',
			'H5P.ContinuousText': 'h5p/h5p-continuous-text',
			'H5P.CoursePresentation': 'h5p/h5p-course-presentation',
			'H5P.DragNBar': 'h5p/h5p-drag-n-bar',
			'H5P.DragNDrop': 'h5p/h5p-drag-n-drop',
			'H5P.DragNResize': 'h5p/h5p-drag-n-resize',
			'H5P.ExportableTextArea': 'h5p/h5p-exportable-text-area',
			'H5PEditor.CoursePresentation': 'h5p/h5p-editor-course-presentation',
			'H5P.Dialogcards': 'h5p/h5p-dialogcards',
			'H5P.DragQuestion': 'h5p/h5p-drag-question',
			'H5PEditor.DragQuestion': 'h5p/h5p-editor-drag-question',
			'H5P.GreetingCard': 'h5p/h5p-greeting-card',
			'H5P.InteractiveVideo': 'h5p/h5p-interactive-video',
			'H5PEditor.InteractiveVideo': 'h5p/h5p-editor-interactive-video',
			'H5P.Nil': 'h5p/h5p-nil',
			'H5PEditor.Duration': 'h5p/h5p-editor-duration',
			'H5PEditor.Wizard': 'h5p/h5p-editor-wizard',
			'H5P.Summary': 'h5p/h5p-summary',
			'H5P.Link': 'h5p/h5p-link',
			'jQuery.ui': 'h5p/jquery-ui',
			'H5P.JoubelUI': 'h5p/h5p-joubel-ui',
			'H5P.Timeline': 'h5p/h5p-timeline',
			TimelineJS: 'h5p/timelinejs',
			'H5P.MarkTheWords': 'h5p/h5p-mark-the-words',
			'H5P.DragText': 'h5p/h5p-drag-text',
			'H5PEditor.SummaryTextualEditor': 'h5p/h5p-editor-summary-textual-editor',
			'H5P.AudioMinimal': 'h5p/h5p-audio-minimal',
			'H5PEditor.QuestionSetTextualEditor': 'h5p/h5p-editor-question-set-textual-editor',
			'H5P.SingleChoiceSet': 'h5p/h5p-single-choice-set',
			'H5P.GuessTheAnswer': 'h5p/h5p-guess-the-answer',
			'H5P.Chart': 'h5p/h5p-chart',
			'H5P.Transition': 'h5p/h5p-transition',
			'H5P.SoundJS': 'h5p/h5p-soundjs',
			'H5PEditor.Timecode': 'h5p/h5p-editor-timecode',
			'H5P.Column': 'h5p/h5p-column',
			'H5P.DocumentationTool': 'h5p/h5p-documentation-tool',
			'H5P.GoalsAssessmentPage': 'h5p/h5p-goals-assessment-page',
			'H5P.GoalsPage': 'h5p/h5p-goals-page',
			'H5P.StandardPage': 'h5p/h5p-standard-page',
			'H5P.TextInputField': 'h5p/h5p-text-input-field',
			'H5P.DocumentExportPage': 'h5p/h5p-document-export-page',
			'H5P.Collage': 'h5p/h5p-collage',
			'H5PEditor.Collage': 'h5p/h5p-editor-collage',
			'H5P.AppearIn': 'h5p/h5p-appear-in',
			'H5P.TwitterUserFeed': 'h5p/h5p-twitter-user-feed',
			'H5P.FacebookPageFeed': 'h5p/h5p-facebook-page-feed',
			'H5PEditor.ColorSelector': 'h5p/h5p-editor-color-selector',
			'H5P.AdvancedText': 'h5p/h5p-advanced-text',
			'H5P.Question': 'h5p/h5p-question',
			'H5PEditor.ImageCoordinateSelector': 'h5p/h5p-editor-image-coordinate-selector',
			'H5P.ImageHotspotQuestion': 'h5p/h5p-image-hotspot-question',
			'H5PEditor.ImageHotspotQuestion': 'h5p/h5p-editor-image-hotspot-question',
			'H5P.ArithmeticQuiz': 'h5p/h5p-arithmetic-quiz',
			'H5P.ImpressPresentation': 'h5p/h5p-impressive-presentation',
			'H5PEditor.ImpressPresentation': 'h5p/h5p-editor-impressive-presentation',
			Odometer: 'h5p/odometer',
			'H5P.Accordion': 'h5p/h5p-accordion',
			Shepherd: 'h5p/shepherd',
			Tether: 'h5p/tether',
			'H5P.GuidedTour': 'h5p/h5p-guided-tour',
			'H5PEditor.UrlField': 'h5p/h5p-editor-url-field',
			Drop: 'h5p/drop',
			'H5P.GoToQuestion': 'h5p/h5p-go-to-question',
			'H5PEditor.RadioSelector': 'h5p/h5p-editor-radio-selector',
			'H5P.OpenEndedQuestion': 'h5p/h5p-open-ended-question',
			'H5P.SimpleMultiChoice': 'h5p/h5p-simple-multiple-choice',
			'H5P.IVHotspot': 'h5p/h5p-iv-hotspot',
			'H5P.Questionnaire': 'h5p/h5p-questionnaire',
			'H5PEditor.SelectToggleFields': 'h5p/h5p-editor-select-toggle-fields',
			'H5PEditor.RadioGroup': 'h5p/h5p-editor-radio-group',
			'H5P.TrueFalse': 'h5p/h5p-true-false',
			'H5P.FontIcons': 'h5p/h5p-font-icons',
			'H5PEditor.ShowWhen': 'h5p/h5p-editor-show-when',
			'H5P.MiniCourse': 'h5p/h5p-mini-course',
			'H5P.SpeakTheWords': 'h5p/h5p-speak-the-words',
			'H5P.Feedback': 'h5p/h5p-feedback',
			'H5P.HelloWorld': 'h5p/h5p-boilerplate',
			'H5P.AudioRecorder': 'h5p/h5p-audio-recorder',
			'H5P.ThreeJS': 'h5p/h5p-three-js',
			'H5P.ThreeSixty': 'h5p/h5p-three-sixty',
			'H5PEditor.TableList': 'h5p/h5p-editor-table-list',
			'H5PEditor.RangeList': 'h5p/h5p-editor-range-list',
			'H5P.ImageGallery': 'h5p/h5p-image-gallery',
			'H5P.ImageSlider': 'h5p/h5p-image-slider',
			'H5P.ImageSlide': 'h5p/h5p-image-slide',
			'H5P.SpeakTheWordsSet': 'h5p/h5p-speak-the-words-set',
			'H5P.ThreeImage': 'h5p/h5p-three-image',
			'H5P.Matching': 'h5p/h5p-matching',
			'H5P.Shape': 'h5p/h5p-shape',
			'H5PEditor.Shape': 'h5p/h5p-editor-shape',
			'H5P.BranchingScenario': 'h5p/h5p-branching-scenario',
			'H5P.BranchingQuestion': 'h5p/h5p-branching-question',
			'H5P.FreeTextQuestion': 'h5p/h5p-free-text-question',
			'H5P.CKEditor': 'h5p/h5p-ckeditor',
			'H5PEditor.BranchingScenario': 'h5p/h5p-editor-branching-scenario',
			'H5P.MathDisplay': 'h5p/h5p-math-display',
			'H5PEditor.SingleChoiceSetTextualEditor': 'h5p/h5p-editor-single-choice-set-textual-editor',
			'H5PEditor.BranchingQuestion': 'h5p/h5p-editor-branching-question',
			'H5P.MaterialDesignIcons': 'h5p/h5p-material-design-icons',
			'H5P.InteractiveBook': 'h5p/h5p-interactive-book-fork',
			'H5PEditor.AudioRecorder': 'h5p/h5p-editor-audio-recorder',
			'H5PEditor.ThreeImage': 'h5p/h5p-editor-three-image',
			'H5P.GoToScene': 'h5p/h5p-go-to-scene',
			'H5PEditor.MultiLineSelect': 'h5p/h5p-editor-multi-line-select',
			'H5P.ImageMultipleHotspotQuestion': 'h5p/h5p-image-multiple-hotspot-question',
			'H5PEditor.ImageMultipleHotspotQuestion': 'h5p/h5p-editor-image-multiple-hotspot-question',
			'H5P.Row': 'h5p/h5p-row',
			'H5P.MultiMediaChoice': 'h5p/h5p-multi-media-choice',
			'H5P.TextGrouping': 'h5p/h5p-text-grouping',
			'H5P.AdvancedBlanks': 'h5p/h5p-advanced-blanks',
			'H5P.PdfViewer': 'h5p/h5p-pdf-viewer',
			'H5P.RowColumn': 'h5p/h5p-row-column',
			'H5P.Components': 'h5p/h5p-components',
			'H5PEditor.MultiMediaChoice': 'h5p/h5p-editor-multi-media-choice',
		};

		const mappedLibraries: string[] = [];
		for (const library of libraries) {
			if (libraryRepoMap[library]) {
				mappedLibraries.push(libraryRepoMap[library]);
			} else {
				this.logger.warning(
					new H5PLibraryManagementErrorLoggable(
						library,
						new Error(`No GitHub repository mapping found for library ${library}`)
					)
				);
			}
		}

		return mappedLibraries;
	}

	private async fetchGitHubTags(libraries: string[]): Promise<Record<string, string[]>> {
		const octokit = new Octokit({
			// Replace with your GitHub personal access token
			// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
		});
		const tags: Record<string, string[]> = {};

		for (const library of libraries) {
			try {
				const [owner, repo] = library.split('/');
				const response = await octokit.repos.listTags({
					owner,
					repo,
				});
				tags[library] = response.data.map((tag: components['schemas']['tag']) => tag.name);
			} catch (error: unknown) {
				const loggableError =
					error instanceof Error
						? new H5PLibraryManagementErrorLoggable(library, error)
						: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error'));
				this.logger.warning(loggableError);
				tags[library] = [];
			}
		}

		return tags;
	}

	private getHighestPatchTags(tags: string[]): string[] {
		const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)$/;
		const versionMap = new Map<string, { tag: string; patch: number }>();

		for (const tag of tags) {
			const match = tag.match(semverRegex);
			if (!match) continue;
			const [, major, minor, patch] = match;
			const key = `${major}.${minor}`;
			const patchNum = parseInt(patch, 10);

			const existing = versionMap.get(key);
			if (!existing || patchNum > existing.patch) {
				versionMap.set(key, { tag, patch: patchNum });
			}
		}

		return Array.from(versionMap.values()).map((v) => v.tag);
	}

	private async installLibraryTagFromGitHub(library: string, tag: string): Promise<void> {
		const tempFolder = tmpdir();
		const filePath = join(tempFolder, `${library.split('/')[1]}-${tag}.zip`);
		const folderPath = join(tempFolder, `${library.split('/')[1]}-${tag}`);

		await this.downloadGitHubTag(library, tag, filePath);
		this.unzipFile(filePath, tempFolder);
		try {
			await this.libraryManager.installFromDirectory(folderPath);
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(library, error)
					: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error during installation'));
			this.logger.warning(loggableError);
		}
		this.removeTemporaryFiles(filePath, folderPath);
	}

	private async downloadGitHubTag(library: string, tag: string, filePath: string): Promise<void> {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response: AxiosResponse<ReadableStream> = await axios({
				url,
				method: 'GET',
				responseType: 'stream',
			});

			const writer = createWriteStream(filePath);
			(response.data as unknown as NodeJS.ReadableStream).pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			this.logger.info(new H5PLibraryManagementLoggable(`Downloaded ${tag} of ${library} to ${filePath}`));
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(library, error)
					: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error during download'));
			this.logger.warning(loggableError);
		}
	}

	private unzipFile(zipFilePath: string, outputDir: string): void {
		try {
			const zip = new AdmZip(zipFilePath);
			zip.extractAllTo(outputDir, true);
			this.logger.info(new H5PLibraryManagementLoggable(`Unzipped all files from ${zipFilePath} to ${outputDir}`));
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(zipFilePath, error)
					: new H5PLibraryManagementErrorLoggable(zipFilePath, new Error('Unknown error during unzip'));
			this.logger.warning(loggableError);
		}
	}

	private removeTemporaryFiles(filePath: string, folderPath: string): void {
		try {
			// Remove the downloaded zip file
			rmSync(filePath, { force: true });
			this.logger.info(new H5PLibraryManagementLoggable(`Deleted file: ${filePath}`));

			// Remove the unzipped folder
			rmSync(folderPath, { recursive: true, force: true });
			this.logger.info(new H5PLibraryManagementLoggable(`Deleted folder: ${folderPath}`));
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(filePath, error)
					: new H5PLibraryManagementErrorLoggable(filePath, new Error('Unknown error during cleanup'));
			this.logger.warning(loggableError);
		}
	}
}
