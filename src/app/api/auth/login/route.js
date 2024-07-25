import jwt from "jsonwebtoken";

const adminPassword = process.env.ADMIN_PASSWORD;
const secret = process.env.JWT_SECRET;

const createToken = () => {
  return jwt.sign({}, secret);
};

export async function POST(req) {
  const { password, username } = await req.json();
  if (!password) {
    return new Response(JSON.stringify({ error: "Missing Password" }), {
      status: 401,
    });
  }
  if (password === adminPassword && username.toLowerCase() === "admin") {
    const token = createToken();
    return new Response(JSON.stringify({ token }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
}
