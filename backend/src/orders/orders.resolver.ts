import {Inject} from '@nestjs/common';
import {Args, Mutation, Resolver, Query, Subscription} from '@nestjs/graphql';
import {AuthUserDecorator} from 'src/auth/auth-user.decorator';
import {Role} from 'src/auth/role.decorator';
import {NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB} from 'src/common/common.constants';
import {PubSub} from 'graphql-subscriptions';
import {User} from 'src/users/entities/user.entity';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {EditOrderOutput, EditOrderInput} from './dtos/edit-order.dto';
import {GetOrderOutput, GetOrderInput} from './dtos/get-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {Order} from './entities/order.entity';
import {OrdersService} from './orders.service';
import {OrderUpdatesInput} from './dtos/order-updates.dto';
import {TakeOrderInput, TakeOrderOutput} from './dtos/take-order.dto';
import {UsersModule} from 'src/users/users.module';

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

    @Subscription(returns => Order, {
        filter: ({pendingOrders: {ownerId}}, _, {user}) => {
            console.log(ownerId, user.id);
            return ownerId === user.id;
        },
        resolve: ({pendingOrders: {order}}) => order,
    })
    @Role(['Owner'])
    pendingOrders() {
        return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
    }

    @Subscription(returns => Order)
    @Role(['Delivery'])
    cookedOrders() {
        return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
    }

    @Subscription(returns => Order, {
        filter: ({orderUpdates: order}: {orderUpdates: Order}, {input}: {input: OrderUpdatesInput}, {user}: {user: User}) => {
            if (order.driverId !== user.id && order.customerId !== user.id && order.restaurant.ownerId !== user.id) {
                return false;
            }
            return order.id === input.id;
        },
    })
    @Role(['Any'])
    orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
        return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
    }

    @Mutation(returns => TakeOrderOutput)
    @Role(['Delivery'])
    takeOrder(@AuthUserDecorator() driver: User, @Args('input') takeOrderInput: TakeOrderInput): Promise<TakeOrderOutput> {
        return this.ordersService.takeOrder(driver, takeOrderInput);
    }
}
