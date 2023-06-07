/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  /*Post,
  Body,
  Patch,
  Delete,*/
} from "@nestjs/common";
import { ClientKafka, MessagePattern, Payload } from "@nestjs/microservices";
import { Producer } from "@nestjs/microservices/external/kafka.interface";
import { RoutesService } from "./routes.service";
import { RoutesGateway } from './routes.gateway';

@Controller("routes")
export class RoutesController implements OnModuleInit {

  private kafkaProducer: Producer;

  constructor(
    private readonly routesService: RoutesService,
    @Inject('KAFKA_SERVICE') private KafkaClient: ClientKafka, private routeGateway: RoutesGateway,) { }

  /* @Post()
   create(@Body() createRouteDto: CreateRouteDto) {
     return this.routesService.create(createRouteDto);
   }*/

  @Get()
  async findAll() {
    console.log("chegou no controller");
    return await this.routesService.findAll();
  }

  /*@Get(":id")
  findOne(@Param("id") id: string) {
    return this.routesService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(+id, updateRouteDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.routesService.remove(+id);
  }*/

  @Get(":id/start")
  startRoute(@Param("id") id: string) {
    this.kafkaProducer.send({
      topic: "route.new-direction",
      messages: [{
        key: "route.new-direction",
        value: JSON.stringify({ routeId: id, clientId: "" })
      }]
    })
  }

  @MessagePattern('route.new-position')
  xconsumeNewPosition(
    @Payload()
    message: {
      value: {
        routeId: string;
        clientId: string;
        position: [number, number];
        finished: boolean;
      };
    },
  ) {
    console.error("WS NEW POSITION", JSON.stringify(message.value), message.value);
    this.routeGateway.sendPosition({
      ...message.value,
      position: [message.value.position[1], message.value.position[0]],
    });
  }

  @MessagePattern('route.new-position')
  consumeNewPosition(@Payload() message: {
    value: {
      routeId: string;
      clientId: string;
      position: [number, number];
      finished: boolean;
    };
  }): any {
    console.error("WS NEW POSITION2", JSON.stringify(message.value), message.value);
    this.routeGateway.sendPosition({
      ...message.value,
      position: [message.value.position[1], message.value.position[0]],
    });
    return null;
  }

  async onModuleInit() {
    this.kafkaProducer = await this.KafkaClient.connect();
  }

}
