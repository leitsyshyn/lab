import { Liveblocks } from "@liveblocks/node";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;

  const liveblocksSession = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.name,
      email: user.email,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    },
  });

  const { room } = await request.json();

  if (room) {
    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
  }

  const { status, body } = await liveblocksSession.authorize();
  return new Response(body, { status });
}
