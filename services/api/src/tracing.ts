import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { loadEnv } from './config/load-env';

loadEnv();

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const nodeEnv = process.env.NODE_ENV || 'development';
process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'movegh-api';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({ url: otlpEndpoint })
  : nodeEnv === 'development'
    ? new ConsoleSpanExporter()
    : undefined;

const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': process.env.OTEL_SERVICE_NAME,
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
    }),
  ],
});

sdk.start();

const shutdown = () => {
  sdk.shutdown().catch(() => undefined);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
