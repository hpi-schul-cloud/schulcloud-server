import { components } from '@octokit/openapi-types';
import { Octokit } from '@octokit/rest';

export class H5PLibraryMapper {
	public static mapMachineNamesToGitHubRepos(libraries: string[]): string[] {
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

		const repos: string[] = [];
		for (const library of libraries) {
			if (libraryRepoMap[library]) {
				repos.push(libraryRepoMap[library]);
			}
		}

		return repos;
	}

	public static mapMachineNameToGitHubRepo(library: string): string {
		const repo = this.mapMachineNamesToGitHubRepos([library])[0];

		return repo;
	}

	public static async getMachineNameToRepoMapFromGitHub(): Promise<Record<string, string>> {
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
					break;
				}

				page++;
			}

			console.log(`Found ${repos.length} repositories in the ${organization} organization.`);

			for (const repo of repos) {
				try {
					const response = await octokit.repos.getContent({
						owner: organization,
						repo: repo.name,
						path: 'library.json',
					});

					type GitHubContentResponse = { content: string };
					const data = response.data as GitHubContentResponse;
					if (!data || typeof data.content !== 'string') {
						throw new Error('library.json content is missing or not a string');
					}
					const libraryJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
					const libraryJson = JSON.parse(libraryJsonContent) as { machineName?: string };

					if (libraryJson.machineName) {
						machineNameToRepoMap[libraryJson.machineName] = `${organization}/${repo.name}`;
					}
				} catch (error) {
					throw error instanceof Error
						? error
						: new Error(`Unknown error while processing library.json of repository ${repo.name}`);
				}
			}
		} catch (error) {
			throw error instanceof Error
				? error
				: new Error(`Unknown error while fetching repositories for organization ${organization}`);
		}

		return machineNameToRepoMap;
	}
}
