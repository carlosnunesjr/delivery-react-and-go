/* eslint-disable prettier/prettier */
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoutesGateway implements OnModuleInit {
  private kafkaProducer: Producer;

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) { }

  async onModuleInit() {
    this.kafkaProducer = await this.kafkaClient.connect();
  }

  @SubscribeMessage('new-direction')
  handleMessage(client: Socket, payload: { routeId: string }) {
    this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [
        {
          key: 'route.new-direction',
          value: JSON.stringify({
            routeId: payload.routeId,
            clientId: client.id,
          }),
        },
      ],
    });
    console.log(payload);
  }

  async sendPosition(data: {
    clientId: string;
    routeId: string;
    position: [number, number];
    finished: boolean;
  }) {
    const { clientId, ...rest } = data;
    const clients = await this.server.sockets.fetchSockets();
    const socket = clients.find((socket) => {
      if (socket.id == clientId) {
        return socket;
      }
    });

    if (!socket) {
      console.error(
        'Client not exists, refresh React Application and resend new direction again.',
      );
      return;
    }

    console.log('Nest new-position', rest);
    socket.emit('new-position', rest);

    //console.log('Nest clients new-position', clients);
    /*if (!(clientId in clients)) {
      console.error(
        'Client not exists, refresh React Application and resend new direction again.',
      );
      return;
    }*/
    //console.log('Nest new-position', rest);
    //clients[clientId].emit('new-position', rest);
  }
}