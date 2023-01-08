import {Test} from '@nestjs/testing';
import {MailService} from './mail.service';
import {CONFIG_OPTIONS} from 'src/common/common.constants';
import * as FormData from 'form-data';
import got from 'got';

jest.mock('got');
jest.mock('form-data');

const TEST_DOMAIN = 'test-domain';

describe('MailService', () => {
    let service: MailService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: CONFIG_OPTIONS,
                    useValue: {
                        apiKey: 'API-KEY',
                        domain: TEST_DOMAIN,
                        fromEmail: 'test-email',
                    },
                },
            ],
        }).compile();
        service = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('should call sendEmail', () => {
            const sendVerificationEmailArgs = {
                email: 'email',
                code: 'code',
            };
            jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
            service.sendVerificationEmail(sendVerificationEmailArgs.email, sendVerificationEmailArgs.code);

            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith('Verify Your Email', 'verify-email', [
                {key: 'code', value: sendVerificationEmailArgs.code},
                {key: 'username', value: sendVerificationEmailArgs.email},
            ]);
        });
    });
    describe('sendEmail', () => {
        it('should send a email', async () => {
            const ok = await service.sendEmail('', '', [{key: 'one', value: '1'}]);
            const formSpy = jest.spyOn(FormData.prototype, 'append');
            expect(formSpy).toHaveBeenCalled();
            expect(got.post).toHaveBeenCalledTimes(1);
            expect(got.post).toHaveBeenCalledWith(`https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`, expect.any(Object));
            expect(ok).toEqual(true);
        });
        it('fails on error', async () => {
            jest.spyOn(got, 'post').mockImplementation(() => {
                throw new Error();
            });
            const ok = await service.sendEmail('', '', [{key: 'one', value: '1'}]);
            expect(ok).toEqual(false);
        });
    });
});
