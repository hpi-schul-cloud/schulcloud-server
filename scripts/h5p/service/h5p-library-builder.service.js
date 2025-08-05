const childProcess = require('child_process');
const fileSystemHelper = require('../helper/file-system.helper.js');
const H5PGitHubClient = require('./h5p-github.client.js');

class H5pLibraryBuilderService {
	constructor(libraryRepoMap) {
		this.gitHubClient = new H5PGitHubClient();
		this.libraryRepoMap = libraryRepoMap;
	}

	async buildH5pLibrariesFromGitHubAsBulk(libraries) {
		const availableVersions = [];

		for (const library of libraries) {
			this.logLibraryBanner(library);
			await this.buildLibrary(library, availableVersions);
		}
	}

	logLibraryBanner(libraryName) {
		const name = `*   ${libraryName}   *`;
		const border = '*'.repeat(name.length);
		console.log(border);
		console.log(name);
		console.log(border);
	}

	async buildLibrary(library, availableVersions) {
		const result = [];

		const repoName = this.mapMachineNameToGitHubRepo(library);
		if (!repoName) {
			console.log(`No GitHub repository found for ${library}.`);
			return [];
		}

		const tags = await this.gitHubClient.fetchGitHubTags(repoName);
		const filteredTags = this.getHighestPatchTags(tags);
		console.log(`Found ${filteredTags.length} versions of ${library} in ${repoName}: ${filteredTags.join(', ')}`);

		for (const tag of filteredTags) {
			const tagResult = await this.buildLibraryVersionAndDependencies(library, tag, repoName, availableVersions);
			result.push(...tagResult);
		}
	}

	// TODO: move this to H5PGitHubClient?
	mapMachineNameToGitHubRepo(library) {
		const repo = this.libraryRepoMap[library];

		return repo;
	}

	getHighestPatchTags(tags) {
		const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)$/;
		const versionMap = new Map();
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
		const highestPatchTags = Array.from(versionMap.values()).map((v) => v.tag);

		return highestPatchTags;
	}

	async buildLibraryVersionAndDependencies(library, tag, repoName, availableVersions) {
		this.logStartBuildingOfLibraryFromGitHub(library, tag);
		const result = [];

		if (this.isCurrentVersionAvailable(library, tag, availableVersions)) return [];
		if (this.isNewerPatchVersionAvailable(library, tag, availableVersions)) return [];

		const libResult = await this.buildLibraryTagFromGitHub(library, tag, repoName);
		if (libResult) {
			result.push(libResult);
			this.logBuildingOfLibraryFromGitHubSuccessful(library, tag);
		} else {
			return [];
		}
		availableVersions.push(`${library}-${tag}`);

		this.logStartBuildingOfDependenciesFromGitHub(library, tag);

		const dependencies = this.getDependenciesFromLibraryJson(library, tag);
		if (dependencies.length === 0) {
			this.logNoDependenciesFoundForLibrary(library, tag);
			return libResult ? [libResult] : [];
		}

		for (const dependency of dependencies) {
			await this.buildLibraryDependency(dependency, library, tag, availableVersions);
		}
		this.logFinishedBuildingOfLibraryFromGitHub(library, tag);

		return result;
	}

	logStartBuildingOfLibraryFromGitHub(library, tag) {
		console.log(`Start building of ${library}-${tag} from GitHub.`);
	}

	logBuildingOfLibraryFromGitHubSuccessful(library, tag) {
		console.log(`Successfully built ${library}-${tag} from GitHub.`);
	}

	logNoDependenciesFoundForLibrary(library, tag) {
		console.log(`No dependencies found for ${library}-${tag}.`);
	}

	logStartBuildingOfDependenciesFromGitHub(library, tag) {
		console.log(`Start building of dependencies for ${library}-${tag} from GitHub.`);
	}

	logFinishedBuildingOfLibraryFromGitHub(library, tag) {
		console.log(`Finished building of ${library}-${tag} from GitHub.`);
	}

	async buildLibraryTagFromGitHub(library, tag, repo) {
		let result = [];
		// TODO: wenn wir filePath vorher erstellen könnten würde der tempFolder hinter dem unzipFile verschwinden welches folderPath zurück gibt.
		// removeTemporaryFiles sollte dann auch nur folderPath als input brauchen.
		// Dann wäre es möglich ein pre and post hook zu erstellen.
		// Wenn man dann noch fileSystemHelper als Klasse instanziiert über ein factory könnte man dort noch mehr implizites Wissen weg kapseln.
		const { filePath, folderPath, tempFolder } = fileSystemHelper.createTempFolder(library, tag);
		await this.gitHubClient.downloadGitHubTag(repo, tag, filePath);

		if (fileSystemHelper.pathExists(folderPath)) {
			fileSystemHelper.removeFolder(folderPath);
		}
		fileSystemHelper.unzipAndRenameFolder(filePath, folderPath, tempFolder, repo, tag);
		fileSystemHelper.removeFile(filePath);

		// TODO: gefühlt gehört das in den try catch rein, es sind dafür aber viel zu viele try catch instanzen.
		// Genauso wie die downloadGitHubTag
		// Wenn das umgesetzt wäre könnte das return result in das try catch rein
		this.executeAdditionalBuildStepsIfRequired(folderPath, library, tag);

		this.cleanUpUnwantedFilesinLibraryFolder(folderPath);

		// TODO: Should this be kept as it would make H5P CLI required!?
		this.validateH5pLibrary(folderPath);

		return result;
	}

	executeAdditionalBuildStepsIfRequired(folderPath, library, tag) {
		this.checkAndCorrectLibraryJsonVersion(folderPath, tag);

		if (this.isPrependNodeOptionsRequired(library, tag)) {
			this.prependNodeOptionsToRunScript(folderPath);
		}

		if (!this.isShepherdLibrary(library) && this.areBuildStepsRequired(folderPath)) {
			const legacyPeerDepsRequired = this.isLegacyPeerDepsRequired(library, tag);
			this.executeBuildSteps(folderPath, library, legacyPeerDepsRequired);
		}

		if (this.isLibraryPathCorrectionRequired(library, tag)) {
			this.checkAndCorrectLibraryJsonPaths(folderPath);
		}
	}

	checkAndCorrectLibraryJsonVersion(folderPath, tag) {
		const libraryJsonPath = fileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = fileSystemHelper.readJsonFile(libraryJsonPath);
			const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
			if (json.majorVersion !== tagMajor || json.minorVersion !== tagMinor || json.patchVersion !== tagPatch) {
				json.majorVersion = tagMajor;
				json.minorVersion = tagMinor;
				json.patchVersion = tagPatch;
				fileSystemHelper.writeJsonFile(libraryJsonPath, json);
				changed = true;
				this.logCorrectedVersionInLibraryJson(folderPath, tag);
			}
		} catch (error) {
			console.error(`Error reading or correcting library.json in ${folderPath}:`, error);
		}

		return changed;
	}

	logCorrectedVersionInLibraryJson(folderPath, tag) {
		console.log(`Corrected version in library.json to match tag ${tag} in ${folderPath}.`);
	}

	isPrependNodeOptionsRequired(library, tag) {
		const prependNodeOptions = {
			'H5P.Dialogcards': ['1.8.8', '1.7.10'],
			'H5P.DragQuestion': ['1.15.4'],
			'H5P.DragText': ['1.10.25', '1.9.5', '1.8.20'],
			'H5P.MultiMediaChoice': ['0.3.56'],
			'H5P.InteractiveVideo': ['1.28.3'],
		};
		const prependNodeOptionsRequired = prependNodeOptions[library]?.includes(tag);

		return prependNodeOptionsRequired;
	}

	prependNodeOptionsToRunScript(folderPath) {
		const packageJsonPath = fileSystemHelper.buildPath(folderPath, 'package.json');
		if (!fileSystemHelper.pathExists(packageJsonPath)) {
			console.warn(`package.json not found in ${folderPath}`);
			return;
		}
		const packageJson = fileSystemHelper.readJsonFile(packageJsonPath);
		if (!packageJson.scripts || !packageJson.scripts.build) {
			console.warn(`No 'build' script found in package.json at ${folderPath}`);
			return;
		}
		const buildScript = packageJson.scripts.build;
		const nodeOptionsPrefix = 'NODE_OPTIONS=--openssl-legacy-provider ';
		if (!buildScript.startsWith(nodeOptionsPrefix)) {
			packageJson.scripts.build = nodeOptionsPrefix + buildScript;
			fileSystemHelper.writeJsonFile(packageJsonPath, packageJson);
			console.log(`Prepended NODE_OPTIONS to 'build' script in ${packageJsonPath}`);
		} else {
			console.log(`'build' script in ${packageJsonPath} already contains NODE_OPTIONS prefix.`);
		}
	}

	isShepherdLibrary(library) {
		const shepherdLibraries = ['Shepherd'];
		const isShepherdLibrary = shepherdLibraries.includes(library);

		return isShepherdLibrary;
	}

	areBuildStepsRequired(folderPath) {
		let buildStepsRequired = false;
		const packageJsonPath = fileSystemHelper.buildPath(folderPath, 'package.json');
		if (fileSystemHelper.pathExists(packageJsonPath)) {
			const packageJson = fileSystemHelper.readJsonFile(packageJsonPath);
			if (!packageJson.scripts || !packageJson.scripts.build) {
				this.logNoBuildScriptInPackageJson(folderPath);
			} else {
				this.logBuildScriptFoundInPackageJson(folderPath);
				buildStepsRequired = true;
			}
		}

		return buildStepsRequired;
	}

	logNoBuildScriptInPackageJson(folderPath) {
		console.log(`No 'build' script found in package.json at ${folderPath}.`);
	}

	logBuildScriptFoundInPackageJson(folderPath) {
		console.log(`Found 'build' script in package.json at ${folderPath}.`);
	}

	isLegacyPeerDepsRequired(library, tag) {
		const legacyPeerDeps = {
			'H5P.DragText': ['1.9.5', '1.8.20'],
		};
		const legacyPeerDepsRequired = legacyPeerDeps[library]?.includes(tag);

		return legacyPeerDepsRequired;
	}

	executeBuildSteps(folderPath, library, legacyPeerDepsRequired = false) {
		try {
			this.logRunningNpmCiAndBuild(folderPath);
			const npmInstallArgs = legacyPeerDepsRequired ? ['ci', '--legacy-peer-deps'] : ['ci'];
			const npmInstall = childProcess.spawnSync('npm', npmInstallArgs, { cwd: folderPath, stdio: 'inherit' });

			if (npmInstall.status !== 0) {
				throw new Error('npm ci failed');
			} else {
				const npmBuild = childProcess.spawnSync('npm', ['run', 'build'], { cwd: folderPath, stdio: 'inherit' });
				if (npmBuild.status !== 0) {
					throw new Error('npm run build failed');
				}
			}
		} catch (error) {
			console.error(`Unknown error while trying to build library ${library} in ${folderPath}:`, error);
		}
	}

	logRunningNpmCiAndBuild(folderPath) {
		console.log(`Running npm ci and npm run build in ${folderPath}.`);
	}

	isLibraryPathCorrectionRequired(library, tag) {
		const libraryPathCorrection = {
			'H5P.MemoryGame': ['1.3.36'],
		};
		const libraryPathCorrectionRequired = libraryPathCorrection[library]?.includes(tag);

		return libraryPathCorrectionRequired;
	}

	checkAndCorrectLibraryJsonPaths(folderPath) {
		const libraryJsonPath = fileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = fileSystemHelper.readJsonFile(libraryJsonPath);

			// List of keys in library.json that may contain file paths
			const filePathKeys = [
				'preloadedJs',
				'preloadedCss',
				'editorJs',
				'editorCss',
				'dynamicDependencies',
				'preloadedDependencies',
				'editorDependencies',
			];

			for (const key of filePathKeys) {
				if (Array.isArray(json[key])) {
					// For dependencies, check for 'path' property
					if (key.endsWith('Dependencies')) {
						const filteredDeps = json[key].filter((dep) => {
							if (this.inputIsObjectWithPath(dep)) {
								const depPath = fileSystemHelper.buildPath(folderPath, dep.path);
								return fileSystemHelper.pathExists(depPath);
							}
							return true;
						});
						if (filteredDeps.length !== json[key].length) {
							json[key] = filteredDeps;
							changed = true;
						}
					} else {
						// For JS/CSS arrays, check each file path
						const filteredFiles = json[key].filter((file) => {
							const filePath = fileSystemHelper.buildPath(folderPath, file.path);
							return fileSystemHelper.pathExists(filePath);
						});
						if (filteredFiles.length !== json[key].length) {
							json[key] = filteredFiles;
							changed = true;
						}
					}
				}
			}

			if (changed) {
				fileSystemHelper.writeJsonFile(libraryJsonPath, json);
				this.logCorrectedFilePathsInLibraryJson(folderPath);
			}
		} catch (error) {
			console.error(`Unknown error while reading or correcting library.json file paths in ${folderPath}:`, error);
		}
		return changed;
	}

	inputIsObjectWithPath(obj) {
		return typeof obj === 'object' && obj !== null && 'path' in obj && typeof obj.path === 'string';
	}

	validateH5pLibrary(folderPath) {
		try {
			const result = childProcess.spawnSync('h5p', ['validate', folderPath], {
				cwd: folderPath,
				stdio: 'inherit',
				shell: true,
			});
			if (result.status === 0) {
				console.log(`'h5p validate' succeeded for ${folderPath}`);
				return true;
			} else {
				console.error(`'h5p validate' failed for ${folderPath}`);
				return false;
			}
		} catch (error) {
			console.error(`Error running 'h5p validate' for ${folderPath}:`, error);
			return false;
		}
	}

	logCorrectedFilePathsInLibraryJson(folderPath) {
		console.log(`Corrected file paths in library.json to only contain available files in ${folderPath}.`);
	}

	cleanUpUnwantedFilesinLibraryFolder(folderPath) {
		const ignoreFilePath = fileSystemHelper.buildPath(folderPath, '.h5pignore');
		if (!fileSystemHelper.pathExists(ignoreFilePath)) {
			return;
		}
		const ignoreContent = fileSystemHelper.readFile(ignoreFilePath);
		const ignoreFiles = ignoreContent
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'));
		for (const relPath of ignoreFiles) {
			const absPath = fileSystemHelper.buildPath(folderPath, relPath);
			if (fileSystemHelper.pathExists(absPath)) {
				try {
					const stat = fileSystemHelper.getStatsOfPath(absPath);
					if (stat.isDirectory()) {
						fileSystemHelper.removeFolder(absPath);
						console.log(`Removed directory from .h5pignore: ${absPath}`);
					} else {
						fileSystemHelper.removeFile(absPath);
						console.log(`Removed file from .h5pignore: ${absPath}`);
					}
				} catch (err) {
					console.error(`Failed to remove ignored file or directory: ${absPath}`, err);
				}
			}
		}
	}

	getDependenciesFromLibraryJson(repoName, tag) {
		const { filePath, folderPath, tempFolder } = fileSystemHelper.createTempFolder(repoName, tag);
		const libraryJsonPath = fileSystemHelper.getLibraryJsonPath(folderPath);
		const libraryJsonContent = fileSystemHelper.readJsonFile(libraryJsonPath);
		const dependencies = (libraryJsonContent?.preloadedDependencies ?? []).concat(
			libraryJsonContent?.editorDependencies ?? [],
			libraryJsonContent?.dynamicDependencies ?? []
		);

		return dependencies;
	}

	async buildLibraryDependency(dependency, library, tag, availableVersions) {
		const depName = dependency.machineName;
		const depMajor = dependency.majorVersion;
		const depMinor = dependency.minorVersion;
		this.logBuildingLibraryDependency(dependency, library, tag);

		const depRepoName = this.mapMachineNameToGitHubRepo(depName);
		if (!depRepoName) {
			this.logGithubRepositoryNotFound(dependency.machineName);
			return [];
		}

		const tags = await this.gitHubClient.fetchGitHubTags(depRepoName);
		const depTag = this.getHighestVersionTags(tags, depMajor, depMinor);
		if (!depTag) {
			this.logTagNotFound(dependency);
			return [];
		}

		const depResult = await this.buildLibraryVersionAndDependencies(depName, depTag, depRepoName, availableVersions);
		if (depResult.length > 0) {
			this.logBuildingLibraryDependencySuccess(depName, depTag);
			return depResult;
		}

		return [];
	}

	logBuildingLibraryDependency(dependency, library, tag) {
		console.log(
			`Building dependency ${dependency.machineName}-${dependency.majorVersion}.${dependency.minorVersion}.x from GitHub for ${library}-${tag}.`
		);
	}

	logGithubRepositoryNotFound(library) {
		console.log(`No GitHub repository found for ${library}.`);
	}

	logTagNotFound(dependency) {
		console.log(
			`No suitable tag found for dependency ${dependency.machineName}-${dependency.majorVersion}.${dependency.minorVersion}.x .`
		);
	}

	logBuildingLibraryDependencySuccess(depName, depTag) {
		console.log(`Successfully built dependency ${depName}-${depTag} from GitHub.`);
	}

	getHighestVersionTags(tags, majorVersion, minorVersion) {
		const matchingTags = tags.filter((t) => {
			const [maj, min] = t.split('.').map(Number);
			return maj === majorVersion && min === minorVersion;
		});
		let highestVersionTag;
		if (matchingTags.length > 0) {
			highestVersionTag = matchingTags.reduce((a, b) => {
				const patchA = Number(a.split('.')[2]);
				const patchB = Number(b.split('.')[2]);
				return patchA > patchB ? a : b;
			});
		}

		return highestVersionTag;
	}

	isCurrentVersionAvailable(library, tag, availableVersions) {
		const currentPatchVersionAvailable = availableVersions.includes(`${library}-${tag}`);

		if (currentPatchVersionAvailable) {
			this.logVersionAlreadyAvailable(library, tag);
		}

		return currentPatchVersionAvailable;
	}

	logVersionAlreadyAvailable(library, tag) {
		console.log(`${library}-${tag} is already available.`);
	}

	isNewerPatchVersionAvailable(library, tag, availableVersions) {
		const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
		const newerPatchVersionAvailable = availableVersions.some((v) => {
			const [lib, version] = v.split('-');
			if (lib !== library) return false;
			const [major, minor, patch] = version.split('.').map(Number);
			const result = major === tagMajor && minor === tagMinor && patch >= tagPatch;
			return result;
		});

		if (newerPatchVersionAvailable) {
			this.logNewerPatchVersionAlreadyAvailable(library, tag);
		}

		return newerPatchVersionAvailable;
	}

	logNewerPatchVersionAlreadyAvailable(library, tag) {
		console.log(`A newer patch version of ${library}-${tag} is already available.`);
	}
}

module.exports = H5pLibraryBuilderService;
