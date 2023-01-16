import {Args, Mutation, Resolver, Query} from '@nestjs/graphql';
import {AuthUserDecorator} from 'src/auth/auth-user.decorator';
import {Role} from 'src/auth/role.decorator';
import {User} from 'src/users/entities/user.entity';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {Order} from './entities/order.entity';
import {OrdersService} from './orders.service';

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
}
