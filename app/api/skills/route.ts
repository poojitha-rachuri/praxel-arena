import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        careerMaps: {
          include: {
            careerOutcome: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      icon: skill.icon,
      description: skill.description,
      careerMaps: skill.careerMaps.map((cm) => ({
        careerOutcome: cm.careerOutcome,
        weight: cm.weight,
      })),
    }));

    return NextResponse.json({ skills: formatted });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}
