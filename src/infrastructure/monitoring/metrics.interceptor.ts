import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { MetricsService } from './metrics.service';

type RequestWithRoute = Request & {
  route?: {
    path?: string;
  };
};

@Injectable()
export class MetricsInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly metricsService: MetricsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request =
      context.switchToHttp().getRequest<RequestWithRoute>();

    const response =
      context.switchToHttp().getResponse<Response>();

    const startedAt = process.hrtime.bigint();

    let statusCode = response.statusCode;

    return next.handle().pipe(
      tap({
        next: () => {
          statusCode = response.statusCode;
        },
        error: (error: unknown) => {
          statusCode =
            error instanceof HttpException
              ? error.getStatus()
              : 500;
        },
      }),

      finalize(() => {
        const completedAt = process.hrtime.bigint();

        const durationSeconds =
          Number(completedAt - startedAt) / 1_000_000_000;

        const route =
          `${request.baseUrl}${request.route?.path ?? ''}` ||
          'unknown';

        this.metricsService.recordHttpRequest(
          request.method,
          route,
          statusCode,
          durationSeconds,
        );
      }),
    );
  }
}