import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

export async function POST(req) {
  const { token } = await req.json();
  try {
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token verification failed" }),
        { status: 401 }
      );
    }
    const decodedToken = jwt.verify(token, secret);
    return new Response(JSON.stringify({ message: "Authenticated" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Token verification failed" }),
      { status: 401 }
    );
  }
}
