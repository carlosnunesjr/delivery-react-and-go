package main

import (
	"fmt"
	"log"

	kafka2 "github.com/carlosnunesjr/fullcycle-delivery-simulator/application/kafka"
	"github.com/carlosnunesjr/fullcycle-delivery-simulator/infra/kafka"
	ckafka "github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("error loading .env file")
	}
}

func main() {
	/*route := route.Route{
		ID:       "1",
		ClientID: "1",
	}

	route.LoadPositions()
	stringjson, _ := route.ExportJsonPositions()
	fmt.Println(stringjson[0])*/

	/*producer := kafka.NewKafkaProducer()
	kafka.Publish("ola", "route.new-position", producer)

	for {
		_ = 1
	}
	*/
	msgChan := make(chan *ckafka.Message)
	consumer := kafka.NewKafkaConsumer(msgChan)
	go consumer.Consume()

	for msg := range msgChan {
		fmt.Println(string(msg.Value))
		go kafka2.Produce(msg)
	}
}
