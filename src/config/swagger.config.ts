import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
const swaggerConfig = new DocumentBuilder()
  .setTitle('AFOS Savvy Backend API')
  .setDescription('AFOS Savvy REST API documentation')
  .setVersion('1.0')
  .addGlobalParameters({
    name: 'X-Correlation-Id',
    in: 'header',
    required: false,
    description:
      'Optional request correlation ID. The server generates one when omitted.',
    schema: {
      type: 'string',
      example: '5dd78074-a31d-4075-b7aa-918657399f68',
    },
  })
  .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (
        _controllerKey: string,
        methodKey: string,
      ) => methodKey,
    });

  SwaggerModule.setup('docs', app, documentFactory, {
    useGlobalPrefix: true,
    customSiteTitle: 'AFOS Savvy API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
    },
  });
}