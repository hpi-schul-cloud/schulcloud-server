import { IsArray, IsBoolean, IsInt, IsString } from 'class-validator';

export class ConsentRequestBody {
	@IsArray()
	@IsString({ each: true })
	grant_scope?: string[];

	@IsBoolean()
	remember?: boolean;

	@IsInt()
	remember_for?: number;
}
