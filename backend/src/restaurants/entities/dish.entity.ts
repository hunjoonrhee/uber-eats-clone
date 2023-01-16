import {Field, InputType, Int, ObjectType} from '@nestjs/graphql';
import {IsNumber, IsString, Length} from 'class-validator';
import {Entity, Column, ManyToOne, RelationId} from 'typeorm';
import {CoreEntity} from '../../common/entities/core.entity';
import {Restaurant} from './restaurant.entity';

@InputType('DishChoiceInputType', {isAbstract: true})
@ObjectType()
export class DishChoice {
    @Field(type => String)
    name: string;

    @Field(type => Int, {nullable: true})
    extra?: number;
}

@InputType('DishOptionInputType', {isAbstract: true})
@ObjectType()
export class DishOption {
    @Field(type => String)
    name: string;

    @Field(type => [DishChoice], {nullable: true})
    choices?: DishChoice[];

    @Field(type => Int, {nullable: true})
    extra?: number;
}

@InputType('DishInputType', {isAbstract: true})
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
    @Field(type => String)
    @IsString()
    @Column()
    @Length(5)
    name: string;

    @Field(type => Int)
    @Column()
    @IsNumber()
    price: number;

    @Field(type => String, {nullable: true})
    @IsString()
    @Column({nullable: true})
    photo: string;

    @Field(type => String)
    @IsString()
    @Column()
    @Length(5, 140)
    description: string;

    @ManyToOne(type => Restaurant, restaurant => restaurant.menu, {onDelete: 'CASCADE'})
    @Field(type => Restaurant)
    restaurant: Restaurant;

    @RelationId((dish: Dish) => dish.restaurant)
    restaurantId: number;

    @Field(type => [DishOption], {nullable: true})
    @Column({type: 'json', nullable: true})
    options?: DishOption[];
}
