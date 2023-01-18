import {Field, InputType, ObjectType} from '@nestjs/graphql';
import {Column, Entity, ManyToOne, OneToMany, RelationId} from 'typeorm';
import {IsString} from 'class-validator';
import {CoreEntity} from 'src/common/entities/core.entity';
import {Category} from './category.entity';
import {User} from 'src/users/entities/user.entity';
import {Dish} from './dish.entity';
import {Order} from 'src/orders/entities/order.entity';

@InputType('RestaurantInputType', {isAbstract: true})
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    @Field(type => String)
    @IsString()
    @Column()
    name: string;

    @Field(type => String)
    @IsString()
    @Column()
    address: string;

    @Field(type => String, {nullable: true})
    @IsString()
    @Column({nullable: true})
    coverImg: string;

    @ManyToOne(type => Category, category => category.restaurants, {nullable: true, onDelete: 'SET NULL', eager: true})
    @Field(type => Category, {nullable: true})
    category: Category;

    @ManyToOne(type => User, user => user.restaurants, {nullable: true, onDelete: 'CASCADE'})
    @Field(type => User)
    owner: User;

    @OneToMany(type => Order, order => order.restaurant)
    @Field(type => [Order])
    orders: Order[];

    @OneToMany(type => Dish, dish => dish.restaurant)
    @Field(type => [Dish])
    menu: Dish[];

    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;
}
