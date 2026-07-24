import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

type HttpMetricLabels = 'method' | 'route' | 'status_code';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly requestCounter: Counter<HttpMetricLabels>;

  private readonly requestDuration: Histogram<HttpMetricLabels>;

  constructor() {
    this.registry.setDefaultLabels({
      service: 'afos-savvy-backend',
    });

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'afos_',
    });

    this.requestCounter = new Counter<HttpMetricLabels>({
      name: 'afos_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram<HttpMetricLabels>({
      name: 'afos_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
    };

    this.requestCounter.inc(labels);
    this.requestDuration.observe(labels, durationSeconds);
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
