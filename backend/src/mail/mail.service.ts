import {Inject, Injectable} from '@nestjs/common';
import {CONFIG_OPTIONS} from '../common/common.constants';
import {EmailVars, MailModuleOptions} from './mail.interface';
import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
    constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions) {}

    async sendEmail(subject: string, template: string, emailVars: EmailVars[]): Promise<boolean> {
        const form = new FormData();
        form.append('from', `Joon from Nuber Eats <mailgun@${this.options.domain}>`);
        form.append('to', 'dev.master0917@gmail.com');
        form.append('subject', subject);
        form.append('template', template);

        emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
        try {
            const response = await got.post(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
                },
                body: form,
            });
            console.log(response.body);
            return true;
        } catch (e) {
            return false;
        }
    }

    sendVerificationEmail(email: string, code: string) {
        console.log(email, code);
        this.sendEmail('Verify Your Email', 'verify-email', [
            {key: 'code', value: code},
            {key: 'username', value: email},
        ]);
    }
}
