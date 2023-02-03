import { Injectable } from "@nestjs/common";
import { Cron, Interval, SchedulerRegistry, Timeout } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { LessThan, Repository } from "typeorm";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { GetPaymentOutput } from "./dtos/get-payments.dto";
import { Payment } from "./entities/payment.entity";


@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentsRepo: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurantsRepo: Repository<Restaurant>,
    ) {}

    async createPayment(owner: User, {transactionId, restaurantId}: CreatePaymentInput): Promise<CreatePaymentOutput> {
        try {
            const restaurant = await this.restaurantsRepo.findOne( {where: {id: restaurantId}})
            if(!restaurant){
                return {
                    ok: false,
                    error: 'Restaurant not found'
                }
            }
            if(restaurant.ownerId !== owner.id){
                return {
                    ok: false,
                    error: 'You are not allowed to do this'
                }
            }
            await this.paymentsRepo.save(this.paymentsRepo.create({
                transactionId,
                user: owner,
                restaurant
            }))
            restaurant.isPromoted = true;
            const date = new Date();
            date.setDate(date.getDate() + 7);
            restaurant.promotedUntil = date;
            this.restaurantsRepo.save(restaurant);
        return {ok: true}
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create a payment' 
            }
        }
    }

    async getPayments(user: User): Promise<GetPaymentOutput> {
        try {
            const payments = await this.paymentsRepo.find({where: {userId: user.id}})
            return {
                ok: true, 
                payments,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load payments'
            }
        }
    }

    @Interval(2000)
    async checkPromotedRestaurants() {
        const restaurants = await this.restaurantsRepo.find({where: {isPromoted: true, promotedUntil: LessThan(new Date())}});
        console.log(restaurants);
        restaurants.forEach(async restaurant => {
            restaurant.isPromoted = false
            restaurant.promotedUntil = null
            await this.restaurantsRepo.save(restaurant);
        })

    }
}