/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsInt, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class VectorIndicesValuesDto {
	@IsArray()
	@IsNumber({}, { each: true })
	indices!: number[];

	@IsArray()
	@IsNumber({}, { each: true })
	values!: number[];
}

export class VectorDto {
	@IsOptional()
	@IsArray()
	@IsNumber({}, { each: true })
	vector1d?: number[];

	@IsOptional()
	@IsArray()
	@IsArray({ each: true })
	@IsNumber({}, { each: true })
	vector2d?: number[][];

	@IsOptional()
	@ValidateNested()
	@Type(() => VectorIndicesValuesDto)
	indicesValues?: VectorIndicesValuesDto;

	@IsOptional()
	@IsObject()
	other?: Record<string, number[] | number[][] | VectorIndicesValuesDto | undefined>;
}

export class BoardDto {
	@ApiProperty()
	@IsDefined()
	@IsString()
	id!: string | number;

	@ApiProperty()
	@IsDefined()
	@IsInt()
	version!: number;

	@ApiProperty()
	@IsDefined()
	@IsNumber()
	score!: number;

	@ApiProperty()
	@IsOptional()
	@IsObject()
	payload?: Record<string, unknown> | null;

	@ApiProperty({ type: VectorDto, required: false })
	@IsOptional()
	@ValidateNested()
	@Type(() => VectorDto)
	vector?: VectorDto;

	@ApiProperty({ required: false })
	@IsOptional()
	shard_key?: string | number | Record<string, unknown>;

	@ApiProperty({ required: false })
	@IsOptional()
	order_value?: number | Record<string, unknown>;
}
