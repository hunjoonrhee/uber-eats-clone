import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUserDecorator } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { GetPaymentOutput } from "./dtos/get-payments.dto";
import { Payment } from "./entities/payment.entity";
import { PaymentsService } from "./payments.service";


@Resolver (of => Payment)
export class PaymentsResolver {
    constructor(
        private readonly paymentsService: PaymentsService
    ){}
    
    @Mutation (returns => CreatePaymentOutput)
    @Role(['Owner'])
    createPayment(@AuthUserDecorator() owner: User, @Args('input') createPaymentInput: CreatePaymentInput): Promise<CreatePaymentOutput> {
        return this.paymentsService.createPayment(owner, createPaymentInput)
    }

    @Query(returns => GetPaymentOutput)
    @Role(['Owner'])
    getPayments(@AuthUserDecorator() user: User): Promise<GetPaymentOutput> {
        return this.paymentsService.getPayments(user)
    }

}