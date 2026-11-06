import { plainToInstance, Type } from 'class-transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsInt,
	IsMongoId,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
	validateSync,
} from 'class-validator';

export class ExampleFilesCounts {
	@IsInt()
	@Min(0)
	public personal = 0;

	@IsInt()
	@Min(0)
	public course = 0;

	@IsInt()
	@Min(0)
	public teams = 0;
}

// Broken files are a subset of the teams files; directories are counted inside the teams total as well.
export class BrokenTeamsFilesCounts {
	@IsInt()
	@Min(0)
	public noStorageProvider = 0;

	@IsInt()
	@Min(0)
	public unknownStorageProvider = 0;

	@IsInt()
	@Min(0)
	public nonExistingBucket = 0;

	@IsInt()
	@Min(0)
	public markedDeleted = 0;

	@IsInt()
	@Min(0)
	public directories = 0;
}

export class ExampleFilesConfig {
	@ValidateNested()
	@Type(() => ExampleFilesCounts)
	public counts!: ExampleFilesCounts;

	@IsOptional()
	@ValidateNested()
	@Type(() => BrokenTeamsFilesCounts)
	public brokenTeamsFiles: BrokenTeamsFilesCounts = new BrokenTeamsFilesCounts();

	@IsOptional()
	@IsString()
	public storageProviderId?: string;

	@IsOptional()
	@IsString()
	public namePrefix = 'generated-';

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsMongoId({ each: true })
	public userIds?: string[];
}

export const parseExampleFilesConfig = (raw: unknown): ExampleFilesConfig => {
	const config: ExampleFilesConfig = plainToInstance(ExampleFilesConfig, raw);
	const errors = validateSync(config, { forbidUnknownValues: true });
	if (errors.length > 0) {
		throw new Error(`Invalid example files config: ${errors.map((error) => error.toString()).join('; ')}`);
	}

	const { brokenTeamsFiles, counts } = config;
	const brokenTotal =
		brokenTeamsFiles.noStorageProvider +
		brokenTeamsFiles.unknownStorageProvider +
		brokenTeamsFiles.nonExistingBucket +
		brokenTeamsFiles.markedDeleted +
		brokenTeamsFiles.directories;
	if (brokenTotal > counts.teams) {
		throw new Error(`Sum of brokenTeamsFiles (${brokenTotal}) must not exceed counts.teams (${counts.teams})`);
	}

	return config;
};
