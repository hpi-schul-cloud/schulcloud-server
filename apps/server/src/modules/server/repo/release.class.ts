import { IsString, IsDate, IsOptional } from 'class-validator';
import { Release } from '../domain';

export class ReleaseClass implements Release {
	@IsString()
	public id!: string;

	@IsString()
	public name!: string;

	@IsString()
	public body!: string;

	@IsString()
	public url!: string;

	@IsString()
	public author!: string;

	@IsString()
	public authorUrl!: string;

	@IsDate()
	public createdAt!: Date;

	@IsDate()
	public publishedAt!: Date;

	@IsOptional()
	@IsString()
	public zipUrl?: string;
}
