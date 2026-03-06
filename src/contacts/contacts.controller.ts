import { Controller, Post, Body, Get } from '@nestjs/common';
import { IdentifyDto } from 'src/contacts/dto/identify.dto';
import { ContactsService } from './contacts.service';

@Controller()
export class ContactsController {

    constructor(private readonly contactService: ContactsService) {}

    @Post("/identify")
    async identify(@Body() body: IdentifyDto){
        return this.contactService.identify(body)
    }

    @Post("/seed")
    async seed() {
        return this.contactService.seedDatabase()
    }

    @Get('/')
    health(){
        return "System is up and running"
    }

}
