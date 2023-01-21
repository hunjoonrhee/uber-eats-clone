import {Inject, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Dish} from '../restaurants/entities/dish.entity';
import {Restaurant} from '../restaurants/entities/restaurant.entity';
import {User, UserRole} from '../users/entities/user.entity';
import {Repository} from 'typeorm';
import {CreateOrderInput, CreateOrderOutput} from './dtos/create-order.dto';
import {GetOrdersInput, GetOrdersOutput} from './dtos/get-orders.dto';
import {OrderItem} from './entities/order-item.entity';
import {Order, OrderStatus} from './entities/order.entity';
import {GetOrderInput, GetOrderOutput} from './dtos/get-order.dto';
import {EditOrderInput, EditOrderOutput} from './dtos/edit-order.dto';
import {NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB} from 'src/common/common.constants';
import {PubSub} from 'graphql-subscriptions';
import {TakeOrderInput, TakeOrderOutput} from './dtos/take-order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
        @InjectRepository(Restaurant) private readonly restaurantsRepo: Repository<Restaurant>,
        @InjectRepository(Dish) private readonly dishesRepo: Repository<Dish>,
        @InjectRepository(OrderItem) private readonly orderItemsRepo: Repository<OrderItem>,
        @Inject(PUB_SUB) private readonly pubSub: PubSub
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
                }
                orderFinalPrice = orderFinalPrice + dishFinalPrice;
                const orderItem = await this.orderItemsRepo.save(
                    this.orderItemsRepo.create({
                        dish,
                        options: item.options,
                    })
                );
                orderItems.push(orderItem);
            }
            const order = await this.ordersRepo.save(
                this.ordersRepo.create({customer, restaurant, total: orderFinalPrice, items: orderItems})
            );
            await this.pubSub.publish(NEW_PENDING_ORDER, {pendingOrders: {order, ownerId: restaurant.ownerId}});
            return {
                ok: true,
            };
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
                    where: {customer: {id: user.id}, ...(status && {status})},
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.ordersRepo.find({
                    where: {driver: {id: user.id}, ...(status && {status})},
                });
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurantsRepo.find({
                    where: {
                        owner: {id: user.id},
                    },
                    relations: ['orders'],
                });
                orders = restaurants.map(restaurant => restaurant.orders).flat(1);
                if (status) {
                    orders = orders.filter(order => order.status === status);
                }
                return {
                    ok: true,
                    orders: orders,
                };
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

    canSeeOrder(user: User, order: Order): boolean {
        let canSee = true;
        if (user.role === UserRole.Client && order.customerId !== user.id) {
            canSee = false;
        }
        if (user.role === UserRole.Delivery && order.driverId !== user.id) {
            canSee = false;
        }
        if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
            canSee = false;
        }
        return canSee;
    }

    async getOrder(user: User, {id: orderId}: GetOrderInput): Promise<GetOrderOutput> {
        try {
            const order = await this.ordersRepo.findOne({where: {id: orderId}, relations: ['restaurant']});
            if (!order) {
                return {
                    ok: false,
                    error: 'Order not found',
                };
            }
            const canSee: boolean = this.canSeeOrder(user, order);
            if (!canSee) {
                return {
                    ok: false,
                    error: 'You can not see that',
                };
            }
            return {ok: true, order: order};
        } catch {
            return {
                ok: false,
                order: null,
                error: 'Could not get order',
            };
        }
    }

    async editOrder(user: User, {id: orderId, status}: EditOrderInput): Promise<EditOrderOutput> {
        try {
            const order = await this.ordersRepo.findOne({where: {id: orderId}, relations: ['restaurant']});
            if (!order) {
                return {
                    ok: false,
                    error: 'Order not found',
                };
            }
            const canSee: boolean = this.canSeeOrder(user, order);
            if (!canSee) {
                return {
                    ok: false,
                    error: 'You can not see that',
                };
            }
            let canEdit = true;
            if (user.role === UserRole.Client) {
                canEdit = false;
            }
            if (user.role === UserRole.Owner) {
                if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
                    canEdit = false;
                }
            }
            if (user.role === UserRole.Delivery) {
                if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
                    canEdit = false;
                }
            }
            if (!canEdit) {
                return {
                    ok: false,
                    error: 'You can not do that',
                };
            }
            await this.ordersRepo.save({
                id: orderId,
                status,
            });
            const newOrder = {...order, status};
            if (user.role === UserRole.Owner) {
                if (status === OrderStatus.Cooked) {
                    await this.pubSub.publish(NEW_COOKED_ORDER, {cookedOrders: newOrder});
                }
            }
            await this.pubSub.publish(NEW_ORDER_UPDATE, {orderUpdates: newOrder});
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: 'Could not edit order',
            };
        }
    }
    async takeOrder(driver: User, {id: orderId}: TakeOrderInput): Promise<TakeOrderOutput> {
        try {
            const order = await this.ordersRepo.findOne({where: {id: orderId}});
            if (!order) {
                return {
                    ok: false,
                    error: 'Order was not found',
                };
            }
            if (order.driver) {
                return {
                    ok: false,
                    error: 'This order already has a driver',
                };
            }
            await this.ordersRepo.save({
                id: orderId,
                driver,
            });
            await this.pubSub.publish(NEW_ORDER_UPDATE, {orderUpdates: {...order, driver}});
            return {
                ok: true,
            };
        } catch {
            return {
                ok: false,
                error: 'Could not take order',
            };
        }
    }
}
