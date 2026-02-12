import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Request, Response } from 'express';

@ValueObject()
export class RequestResponseMetricLabel {
	@IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
	public readonly method!: string;

	@IsString()
	public readonly base_url!: string;

	@IsString()
	public readonly full_path!: string;

	@IsString()
	@IsOptional()
	public readonly route_path?: string;

	@IsNumber()
	public readonly status_code!: number;

	constructor(request: Request, response: Response) {
		this.method = request.method;
		this.base_url = request.baseUrl;
		this.status_code = response.statusCode;

		this.full_path = this.base_url;

		if (this.hasPath(request.route)) {
			this.route_path = request.route.path;
			this.full_path = this.base_url + this.route_path;
		}
	}

	private hasPath(reqRoute: unknown): reqRoute is { path: string } {
		return typeof reqRoute === 'object' && reqRoute != null && 'path' in reqRoute;
	}
}
