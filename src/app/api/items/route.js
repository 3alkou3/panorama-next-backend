import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const items = await prisma.item.findMany();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}

export async function POST(req) {
  try {
    const { name, price, categoryId, type, description, order } =
      await req.json();
    const newItem = await prisma.item.create({
      data: {
        name,
        price,
        category: { connect: { id: categoryId } },
        type,
        description,
        order: Number(order),
      },
    });
    return NextResponse.json(newItem);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}

export async function PUT(req) {
  try {
    const { itemId } = req.query;
    const newData = await req.json();
    const { order: newOrder } = newData;

    const existingItem = await prisma.item.findUnique({
      where: { id: Number(itemId) },
      select: { order: true },
    });

    if (!existingItem) {
      throw new Error("Item not found");
    }

    const currentOrder = existingItem.order;

    const updatedItem = await prisma.item.update({
      where: { id: Number(itemId) },
      data: { order: newOrder, ...newData },
    });

    await prisma.item.updateMany({
      where: { order: newOrder, id: { not: Number(itemId) } },
      data: { order: currentOrder },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item order:", error);
    return NextResponse.error("Internal server error");
  }
}

export async function DELETE(req) {
  try {
    const { itemId } = req.query;

    const itemToDelete = await prisma.item.findUnique({
      where: { id: Number(itemId) },
      select: { order: true },
    });

    if (!itemToDelete) {
      throw new Error("Item not found");
    }

    const orderToDelete = itemToDelete.order;

    const deletedItem = await prisma.item.delete({
      where: { id: Number(itemId) },
    });

    await prisma.item.updateMany({
      where: {
        order: { gt: orderToDelete },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json(deletedItem);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}
