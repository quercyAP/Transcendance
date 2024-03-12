import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({
    origin: '*:*',
    credentials: true,
  });

  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('This is the API for the Transcendence project')
    .setVersion('0.1')
    .setDefaultContentType('application/json')
    .addSecurity('user-password', { type: 'userPassword' })
    .addServer('ws-users', {
      url: 'http://localhost:4001/users',
      protocol: 'socket.io',
    })
    .addServer('ws-chat', {
      url: 'http://localhost:4001/chat',
      protocol: 'socket.io',
    })
    .build();

  const asyncapiDocument = await AsyncApiModule.createDocument(
    app,
    asyncApiOptions,
  );
  await AsyncApiModule.setup('/api/doc/asyncapi', app, asyncapiDocument);

  const config = new DocumentBuilder()
    .setTitle('42-Transcendence API')
    .setDescription('This is the API for the 42-Transcendence project')
    .setVersion('1.0')
    .addTag('42-Transcendence')
    .addCookieAuth('trans42_access')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/doc/swagger', app, document);

  //   app.setGlobalPrefix('api');
  await app.listen(3001);
}
bootstrap();
