import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Params } from 'nestjs-pino';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const VALID_CORRELATION_ID = /^[a-zA-Z0-9._:-]{1,128}$/;

function resolveCorrelationId(
  headerValue: string | string[] | undefined,
): string {
  const value = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  if (value && VALID_CORRELATION_ID.test(value)) {
    return value;
  }

  return randomUUID();
}

export function createLoggerConfig(
  configService: ConfigService,
): Params {
  const environment =
    configService.get<string>('NODE_ENV') ?? 'development';

  const isProduction = environment === 'production';

  return {
    pinoHttp: {
      level:
        configService.get<string>('LOG_LEVEL') ??
        (isProduction ? 'info' : 'debug'),

      genReqId: (request, response) => {
        const correlationId = resolveCorrelationId(
          request.headers[CORRELATION_ID_HEADER],
        );

        response.setHeader(
          CORRELATION_ID_HEADER,
          correlationId,
        );

        return correlationId;
      },

      customProps: (request) => ({
        correlationId: request.id,
        service: 'afos-savvy-backend',
        environment,
      }),

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },

      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          },
    },
  };
}