import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { computeRelationship } from '../relationship';

const Gender = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']);
const UnionType = z.enum(['MARRIAGE', 'CIVIL_UNION', 'PARTNERSHIP', 'UNKNOWN']);

const PersonInput = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthName: z.string().optional(),
  gender: Gender.optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  deathDate: z.string().optional(),
  deathPlace: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

const CreateRelation = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SPOUSE_OF'),
    personId: z.string(),
    unionType: UnionType.optional(),
  }),
  z.object({
    type: z.literal('CHILD_OF'),
    parentIds: z.array(z.string()).min(1).max(2),
  }),
]);

export const personRouter = router({
  list: protectedProcedure.query(() =>
    prisma.person.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) =>
      prisma.person.findUnique({
        where: { id: input.id },
        include: {
          unionsAsPartner1: { include: { partner2: true } },
          unionsAsPartner2: { include: { partner1: true } },
          asParent: { include: { child: true } },
          asChild: { include: { parent: true } },
        },
      })
    ),

  search: protectedProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(({ input }) =>
      prisma.person.findMany({
        where: {
          OR: [
            { firstName: { contains: input.q, mode: 'insensitive' } },
            { lastName: { contains: input.q, mode: 'insensitive' } },
            { birthName: { contains: input.q, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      })
    ),

  relationship: protectedProcedure
    .input(z.object({ personAId: z.string(), personBId: z.string() }))
    .query(({ input }) =>
      computeRelationship(input.personAId, input.personBId)
    ),

  create: adminProcedure.input(PersonInput).mutation(({ input, ctx }) =>
    prisma.person.create({
      data: { ...input, createdById: ctx.session.user.id },
    })
  ),

  // Crée une personne ET sa relation à une autre personne / un couple en une seule mutation.
  // Utilisé par les boutons "+ conjoint" / "+ enfant" du whiteboard.
  createLinked: adminProcedure
    .input(z.object({ person: PersonInput, relation: CreateRelation }))
    .mutation(async ({ input, ctx }) => {
      // Calcule une position de départ proche de la personne liée pour éviter (0,0).
      let positionX: number | null = null;
      let positionY: number | null = null;

      if (input.relation.type === 'SPOUSE_OF') {
        const ref = await prisma.person.findUnique({
          where: { id: input.relation.personId },
          select: { positionX: true, positionY: true },
        });
        positionX = (ref?.positionX ?? 0) + 280;
        positionY = ref?.positionY ?? 0;
      } else {
        const ref = await prisma.person.findUnique({
          where: { id: input.relation.parentIds[0] },
          select: { positionX: true, positionY: true },
        });
        positionX = ref?.positionX ?? 0;
        positionY = (ref?.positionY ?? 0) + 240;
      }

      const created = await prisma.person.create({
        data: {
          ...input.person,
          positionX,
          positionY,
          createdById: ctx.session.user.id,
        },
      });

      if (input.relation.type === 'SPOUSE_OF') {
        await prisma.union.create({
          data: {
            partner1Id: input.relation.personId,
            partner2Id: created.id,
            type: input.relation.unionType ?? 'MARRIAGE',
          },
        });
      } else {
        for (const parentId of input.relation.parentIds) {
          await prisma.parentChild.create({
            data: { parentId, childId: created.id },
          });
        }
      }

      return created;
    }),

  updatePosition: adminProcedure
    .input(
      z.object({
        id: z.string(),
        positionX: z.number(),
        positionY: z.number(),
      })
    )
    .mutation(({ input }) =>
      prisma.person.update({
        where: { id: input.id },
        data: { positionX: input.positionX, positionY: input.positionY },
      })
    ),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: PersonInput }))
    .mutation(({ input }) =>
      prisma.person.update({ where: { id: input.id }, data: input.data })
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) =>
      prisma.person.delete({ where: { id: input.id } })
    ),
});
