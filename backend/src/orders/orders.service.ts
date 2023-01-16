import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Dish} from 'src/restaurants/entities/dish.entity';
import {Restaurant} from 'src/restaurants/entities/restaurant.entity';
import {User, UserRole} from 'src/users/entities/user.entity';
import {Equal, FindOptionsWhere, Repository} from 'typeorm';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {OrderItem} from './entities/order-item.entity';
import {Order} from './entities/order.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
        @InjectRepository(Restaurant) private readonly restaurantsRepo: Repository<Restaurant>,
        @InjectRepository(Dish) private readonly dishesRepo: Repository<Dish>,
        @InjectRepository(OrderItem) private readonly orderItemsRepo: Repository<OrderItem>
    ) {}

    async createOrder(customer: User, {restaurantId, items}: CreateOrderInput): Promise<CreateOrderOutput> {
        try {
            const restaurant = await this.restaurantsRepo.findOne({where: {id: restaurantId}});
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                };
            }
            let orderFinalPrice = 0;
            const orderItems: OrderItem[] = [];
            for (const item of items) {
                const dish = await this.dishesRepo.findOne({where: {id: item.dishId}});
                if (!dish) {
                    return {
                        ok: false,
                        error: 'Dish not found',
                    };
                }
                let dishFinalPrice = dish.price;
                for (const itemOption of item.options) {
                    const dishOption = dish.options.find(dishOption => dishOption.name === itemOption.name);
                    if (dishOption) {
                        if (dishOption.extra) {
                            dishFinalPrice = dishFinalPrice + dishOption.extra;
                        } else {
                            const dishOptionChoice = dishOption.choices.find(optionChoice => optionChoice.name === itemOption.choice);
                            if (dishOptionChoice) {
                                if (dishOptionChoice.extra) {
                                    dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                                }
                            }
                        }
                    }
                    const orderItem = await this.orderItemsRepo.save(
                        this.orderItemsRepo.create({
                            dish,
                            options: item.options,
                        })
                    );
                    orderItems.push(orderItem);
                }
                orderFinalPrice = orderFinalPrice + dishFinalPrice;
            }
            await this.ordersRepo.save(this.ordersRepo.create({customer, restaurant, total: orderFinalPrice, items: orderItems}));
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not create restaurant',
            };
        }
    }
    async getOrders(user: User, {status}: GetOrdersInput): Promise<GetOrdersOutput> {
        try {
            let orders: Order[];
            if (user.role === UserRole.Client) {
                orders = await this.ordersRepo.find({
                    where: {customer: user},
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.ordersRepo.find({
                    where: {driver: user},
                });
            } else if (user.role === UserRole.Owner) {
                orders = await this.restaurantsRepo.find({where: {owner: user}});
                console.log(user.id);
                console.log('xxxXXX', orders);
            }
            return {ok: true, orders: null};
        } catch {
            return {
                ok: false,
                orders: null,
                error: 'Could not get orders',
            };
        }
    }
}
