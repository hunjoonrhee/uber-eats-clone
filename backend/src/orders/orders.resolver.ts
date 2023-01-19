import {Inject} from '@nestjs/common';
import {Args, Mutation, Resolver, Query, Subscription} from '@nestjs/graphql';
import {AuthUserDecorator} from 'src/auth/auth-user.decorator';
import {Role} from 'src/auth/role.decorator';
import {PUB_SUB} from 'src/common/common.constants';
import {PubSub} from 'graphql-subscriptions';
import {User} from 'src/users/entities/user.entity';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {EditOrderOutput, EditOrderInput} from './dtos/edit-order.dto';
import {GetOrderOutput, GetOrderInput} from './dtos/get-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {Order} from './entities/order.entity';
import {OrdersService} from './orders.service';

@Resolver(of => Order)
export class OrdersResolver {
    constructor(private readonly ordersService: OrdersService, @Inject(PUB_SUB) private readonly pubSub: PubSub) {}

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

    @Mutation(returns => Boolean)
    async potatoReady(@Args('potatoId') potatoId: number) {
        await this.pubSub.publish('hotPotatos', {readyPotato: potatoId});
        return true;
    }
    @Subscription(returns => String, {
        filter: ({readyPotato}, {potatoId}) => {
            return readyPotato === potatoId;
        },
    })
    @Role(['Any'])
    readyPotato(@Args('potatoId') potatoId: number) {
        return this.pubSub.asyncIterator('hotPotatos');
    }
}
