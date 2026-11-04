import { JwtAuthGuard } from '@infra/auth-guard';
import { JwtExtractor } from '@shared/common/utils';
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { type Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
	public override canActivate(context: ExecutionContext): ReturnType<JwtAuthGuard['canActivate']> {
		const request = context.switchToHttp().getRequest<Request>();

		if (!JwtExtractor.extractJwtFromRequest(request)) {
			return true;
		}

		return super.canActivate(context);
	}
}
