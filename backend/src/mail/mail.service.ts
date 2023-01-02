import {Inject, Injectable} from '@nestjs/common';
import {CONFIG_OPTIONS} from '../common/common.constants';
import {EmailVars, MailModuleOptions} from './mail.interface';
import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
  ) {}

  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVars[]
  ) {
    const form = new FormData();
    form.append(
      'from',
      `Joon from Nuber Eats <mailgun@${this.options.domain}>`
    );
    form.append('to', 'dev.master0917@gmail.com');
    form.append('subject', subject);
    form.append('template', template);

    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`
          ).toString('base64')}`
        },
        body: form
      });
    } catch (e) {
      console.log(e);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      {key: 'code', value: code},
      {key: 'username', value: email}
    ]);
  }
}