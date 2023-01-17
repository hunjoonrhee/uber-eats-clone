import {Field, Float, InputType, ObjectType, registerEnumType} from '@nestjs/graphql';
import {IsEnum, IsNumber} from 'class-validator';
import {CoreEntity} from 'src/common/entities/core.entity';
import {Restaurant} from 'src/restaurants/entities/restaurant.entity';
import {User} from 'src/users/entities/user.entity';
import {Column, Entity, JoinTable, ManyToMany, ManyToOne, RelationId} from 'typeorm';
import {OrderItem} from './order-item.entity';

export enum OrderStatus {
    Pending = 'Pending',
    Cooking = 'Cooking',
    Cooked = 'Cooked',
    PickedUp = 'PickedUp',
    Delivered = 'Delivered',
}

registerEnumType(OrderStatus, {name: 'OrderStatus'});

@InputType('OrderInputType', {isAbstract: true})
@ObjectType()
@Entity()
export class Order extends CoreEntity {
    @Field(type => User, {nullable: true})
    @ManyToOne(type => User, user => user.orders, {nullable: true, onDelete: 'SET NULL', eager: true})
    customer?: User;

    @RelationId((order: Order) => order.customer)
    customerId: number;

    @Field(type => User, {nullable: true})
    @ManyToOne(type => User, user => user.rides, {nullable: true, onDelete: 'SET NULL', eager: true})
    driver?: User;

    @RelationId((order: Order) => order.driver)
    driverId: number;

    @Field(type => Restaurant)
    @ManyToOne(type => Restaurant, restaurant => restaurant.orders, {nullable: true, onDelete: 'SET NULL', eager: true})
    restaurant?: Restaurant;

    @Field(type => [OrderItem])
    @ManyToMany(type => OrderItem)
    @JoinTable()
    items: OrderItem[];

    @Field(type => Float, {nullable: true})
    @Column({nullable: true})
    @IsNumber()
    total?: number;

    @Field(type => OrderStatus)
    @Column({type: 'enum', enum: OrderStatus, default: OrderStatus.Pending})
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
