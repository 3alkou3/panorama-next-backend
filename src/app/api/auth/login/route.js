import jwt from "jsonwebtoken";

const adminPassword = process.env.ADMIN_PASSWORD;
const secret = process.env.JWT_SECRET;

const createToken = () => {
  return jwt.sign({}, secret);
};

export async function POST(req) {
  const { password, username } = await req.json();
  res.setHeader('Access-Control-Allow-Origin', 'https://panoramacafe.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
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
