import {Args, Mutation, Resolver, Query, Subscription} from '@nestjs/graphql';
import {AuthUserDecorator} from 'src/auth/auth-user.decorator';
import {Role} from 'src/auth/role.decorator';
import {User} from 'src/users/entities/user.entity';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {EditOrderOutput, EditOrderInput} from './dtos/edit-order.dto';
import {GetOrderOutput, GetOrderInput} from './dtos/get-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {Order} from './entities/order.entity';
import {OrdersService} from './orders.service';
import {PubSub} from 'graphql-subscriptions';

const pubsub = new PubSub();

@Resolver(of => Order)
export class OrdersResolver {
    constructor(private readonly ordersService: OrdersService) {}

    @Mutation(returns => CreateOrderOutput)
    @Role(['Client'])
    async createOrder(@AuthUserDecorator() authUser: User, @Args('input') createOrderInput: CreateOrderInput): Promise<CreateOrderOutput> {
        return this.ordersService.createOrder(authUser, createOrderInput);
    }
    @Query(returns => GetOrdersOutput)
    @Role(['Any'])
    async getOrders(@AuthUserDecorator() user: User, @Args('input') getOrdersInput: GetOrdersInput): Promise<GetOrdersOutput> {
        return this.ordersService.getOrders(user, getOrdersInput);
    }

    @Query(returns => GetOrderOutput)
    @Role(['Any'])
    async getOrder(@AuthUserDecorator() user: User, @Args('input') getOrderInput: GetOrderInput): Promise<GetOrderOutput> {
        return this.ordersService.getOrder(user, getOrderInput);
    }

    @Mutation(returns => EditOrderOutput)
    @Role(['Any'])
    async editOrder(@AuthUserDecorator() user: User, @Args('input') editOrderInput: EditOrderInput): Promise<EditOrderOutput> {
        return this.ordersService.editOrder(user, editOrderInput);
    }

    @Subscription(returns => String)
    orderSubscription() {
        return pubsub.asyncIterator('hotPotatos');
    }
}
