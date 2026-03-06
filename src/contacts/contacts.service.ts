import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contact } from './contacts.entity'
import { IdentifyDto } from './dto/identify.dto'

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  async identify(dto: IdentifyDto) {
    const { email, phoneNumber } = dto

    if (!email && !phoneNumber) {
      throw new Error('Email or phoneNumber required')
    }

    const matches = await this.contactRepo.find({
      where: [
        { email },
        { phoneNumber },
      ],
    })

    const primaryIds = new Set<number>()

    for (const c of matches) {
      if (c.linkPrecedence === 'primary') primaryIds.add(c.id)
      else if (c.linkedId) primaryIds.add(c.linkedId)
    }

    if (primaryIds.size === 0) {
      const newContact = this.contactRepo.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
      })

      await this.contactRepo.save(newContact)

      return this.buildResponse([newContact])
    }

    const clusters: Contact[] = []

    for (const id of primaryIds) {
      const contacts = await this.contactRepo.find({
        where: [
          { id },
          { linkedId: id },
        ],
      })

      clusters.push(...contacts)
    }

    const unique = Array.from(
      new Map(clusters.map((c) => [c.id, c])).values(),
    )

    const primaries = unique.filter((c) => c.linkPrecedence === 'primary')

    const finalPrimary = primaries.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest,
    )

    for (const p of primaries) {
      if (p.id !== finalPrimary.id) {
        p.linkPrecedence = 'secondary'
        p.linkedId = finalPrimary.id
        await this.contactRepo.save(p)
      }
    }

    const cluster = await this.contactRepo.find({
      where: [
        { id: finalPrimary.id },
        { linkedId: finalPrimary.id },
      ],
    })

    const emails = new Set(cluster.map((c) => c.email).filter(Boolean))
    const phones = new Set(cluster.map((c) => c.phoneNumber).filter(Boolean))

    const isNewEmail = email && !emails.has(email)
    const isNewPhone = phoneNumber && !phones.has(phoneNumber)

    if (isNewEmail || isNewPhone) {
      const newSecondary = this.contactRepo.create({
        email,
        phoneNumber,
        linkedId: finalPrimary.id,
        linkPrecedence: 'secondary',
      })

      await this.contactRepo.save(newSecondary)
    }

    const finalCluster = await this.contactRepo.find({
      where: [
        { id: finalPrimary.id },
        { linkedId: finalPrimary.id },
      ],
    })

    return this.buildResponse(finalCluster)
  }

  private buildResponse(cluster: Contact[]) {
    const primary: any = cluster.find((c) => c.linkPrecedence === 'primary')

    const secondaries = cluster.filter((c) => c.linkPrecedence === 'secondary')

    return {
      contact: {
        primaryContactId: primary.id,
        emails: [...new Set(cluster.map((c) => c.email).filter(Boolean))],
        phoneNumbers: [...new Set(cluster.map((c) => c.phoneNumber).filter(Boolean))],
        secondaryContactIds: secondaries.map((c) => c.id),
      },
    }
  }

  async seedDatabase() {
    await this.contactRepo.clear()

    const data: Partial<Contact>[] = [
      { id: 1, email: "lorraine@hillvalley.edu", phoneNumber: "111111", linkPrecedence: "primary" },
      { id: 2, email: "lorraine@hillvalley.edu", phoneNumber: "222222", linkedId: 1, linkPrecedence: "secondary" },
      { id: 3, email: "lorraine.alt@hillvalley.edu", phoneNumber: "111111", linkedId: 1, linkPrecedence: "secondary" },

      { id: 4, email: "marty@hillvalley.edu", phoneNumber: "333333", linkPrecedence: "primary" },
      { id: 5, email: "marty@hillvalley.edu", phoneNumber: "444444", linkedId: 4, linkPrecedence: "secondary" },
      { id: 6, email: "marty.mcfly@hillvalley.edu", phoneNumber: "333333", linkedId: 4, linkPrecedence: "secondary" },

      { id: 7, email: "doc@hillvalley.edu", phoneNumber: "555555", linkPrecedence: "primary" },
      { id: 8, email: "doc.brown@hillvalley.edu", phoneNumber: "555555", linkedId: 7, linkPrecedence: "secondary" },

      { id: 9, email: "jennifer@hillvalley.edu", phoneNumber: "666666", linkPrecedence: "primary" },
      { id: 10, email: "jennifer.parker@hillvalley.edu", phoneNumber: "777777", linkedId: 9, linkPrecedence: "secondary" },

      { id: 11, email: "biff@hillvalley.edu", phoneNumber: "888888", linkPrecedence: "primary" },
      { id: 12, email: "biff.tannen@hillvalley.edu", phoneNumber: "888888", linkedId: 11, linkPrecedence: "secondary" },
      { id: 13, email: "biff.tannen@hillvalley.edu", phoneNumber: "999999", linkedId: 11, linkPrecedence: "secondary" },

      { id: 14, email: "george@hillvalley.edu", phoneNumber: "101010", linkPrecedence: "primary" },
      { id: 15, email: "george.mcfly@hillvalley.edu", phoneNumber: "101010", linkedId: 14, linkPrecedence: "secondary" },

      // Bridge case
      { id: 16, email: "lorraine@hillvalley.edu", phoneNumber: "333333", linkedId: 1, linkPrecedence: "secondary" },

      { id: 17, email: "doc@hillvalley.edu", phoneNumber: "121212", linkedId: 7, linkPrecedence: "secondary" },
      { id: 18, email: "doc.brown@hillvalley.edu", phoneNumber: "131313", linkedId: 7, linkPrecedence: "secondary" },

      { id: 19, email: "clara@hillvalley.edu", phoneNumber: "141414", linkPrecedence: "primary" },
      { id: 20, email: "clara.clayton@hillvalley.edu", phoneNumber: "141414", linkedId: 19, linkPrecedence: "secondary" },
    ]

    await this.contactRepo.save(data)

    return {
      message: "Database seeded successfully",
      recordsInserted: data.length,
    }
  }
}