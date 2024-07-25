import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getAllCategories() {
  return prisma.category.findMany();
}

async function getAllItems() {
  return prisma.item.findMany();
}

export async function GET(req) {
  try {
    const categories = await getAllCategories();
    const items = await getAllItems();
    return NextResponse.json({ categories, items });
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}
