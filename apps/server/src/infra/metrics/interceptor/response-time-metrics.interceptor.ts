import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { finalize, Observable } from 'rxjs';
import { RequestResponseMetricLabelFactory } from '../factory';
import { MetricsService } from '../metrics.service';

@Injectable()
export class ResponseTimeMetricsInterceptor implements NestInterceptor {
	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const startTime = Date.now();
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();
		const label = RequestResponseMetricLabelFactory.create(request, response);

		return next.handle().pipe(
			finalize(() => {
				const endTime = Date.now();
				const durationMs = endTime - startTime;
				const durationSeconds = durationMs / 1000;

				MetricsService.responseTimeMetricHistogram.observe(label, durationSeconds);
			})
		);
	}
}
