import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

import { MetricsService } from './metrics.service';

const getRoutePath = (request: Request): string => {
  const route: unknown = request.route;

  if (typeof route === 'object' && route !== null && 'path' in route) {
    const routePath: unknown = route.path;

    if (typeof routePath === 'string') {
      return `${request.baseUrl}${routePath}` || routePath;
    }
  }

  return request.path || request.originalUrl || 'unknown';
};

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();

    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startedAt = process.hrtime.bigint();
    let statusCode = response.statusCode;

    return next.handle().pipe(
      tap({
        next: () => {
          statusCode = response.statusCode;
        },
        error: (error: unknown) => {
          statusCode = error instanceof HttpException ? error.getStatus() : 500;
        },
      }),
      finalize(() => {
        const completedAt = process.hrtime.bigint();

        const durationSeconds = Number(completedAt - startedAt) / 1_000_000_000;

        const route = getRoutePath(request);

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
