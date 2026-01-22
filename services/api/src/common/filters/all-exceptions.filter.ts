import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.headers['x-request-id'];

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    const normalizedMessage =
      typeof message === 'string'
        ? message
        : (message as { message?: string }).message || 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: normalizedMessage,
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
