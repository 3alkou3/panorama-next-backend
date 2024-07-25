import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { buffer } from "micro";
import multer from "multer";

const prisma = new PrismaClient();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Configure Multer to use Firebase Storage
const multerStorage = multer.memoryStorage();
const multerMiddleware = multer({ storage: multerStorage });

// Helper to handle Multer file upload
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export async function GET(req) {
  try {
    const categories = await prisma.category.findMany({
      include: { items: true },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}

export async function POST(req) {
  await runMiddleware(req, {}, multerMiddleware.single("categoryImage"));

  try {
    const { name, type, order, icon } = req.body;

    if (req.file) {
      const storageRef = ref(storage, `files/${name}`);
      const metadata = { contentType: req.file.mimetype };
      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata
      );
      const downloadURL = await getDownloadURL(snapshot.ref);
      req.body.icon = downloadURL;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        order: Number(order),
        icon: req.body.icon,
      },
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}

export async function PUT(req) {
  await runMiddleware(req, {}, multerMiddleware.single("categoryImage"));

  try {
    const { categoryId } = req.query;
    const newData = req.body;
    newData.order = Number(newData.order);

    if (req.file) {
      const storageRef = ref(storage, `files/${newData.name}`);
      const metadata = { contentType: req.file.mimetype };
      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata
      );
      const downloadURL = await getDownloadURL(snapshot.ref);
      newData.icon = downloadURL;
    }

    const { order: newOrder } = newData;

    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      select: { order: true },
    });

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    const currentOrder = existingCategory.order;

    const updatedCategory = await prisma.category.update({
      where: { id: Number(categoryId) },
      data: { order: newOrder, ...newData },
    });

    await prisma.category.updateMany({
      where: { order: newOrder, id: { not: Number(categoryId) } },
      data: { order: currentOrder },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category order:", error);
    return NextResponse.error("Internal server error");
  }
}

export async function DELETE(req) {
  try {
    const { categoryId } = req.query;
    const categoryToDelete = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      select: { order: true },
    });

    if (!categoryToDelete) {
      throw new Error("Category not found");
    }

    const orderToDelete = categoryToDelete.order;

    const deletedCategory = await prisma.category.delete({
      where: { id: Number(categoryId) },
    });

    await prisma.category.updateMany({
      where: { order: { gt: orderToDelete } },
      data: { order: { decrement: 1 } },
    });

    return NextResponse.json(deletedCategory);
  } catch (error) {
    console.error(error);
    return NextResponse.error("Internal Server Error");
  }
}
