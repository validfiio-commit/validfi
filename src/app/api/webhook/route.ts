import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  switch (body.event) {
    case "miniapp_added":
      if (body.notificationDetails) {
        const { url, token } = body.notificationDetails;
        // TODO: Store in your Prisma DB for push notifications
        // await prisma.miniAppUser.upsert({
        //   where: { fid: body.fid },
        //   create: { fid: body.fid, notificationUrl: url, notificationToken: token },
        //   update: { notificationUrl: url, notificationToken: token },
        // });
        console.log("Mini app added with notifications:", body.fid);
      }
      break;

    case "miniapp_removed":
      // await prisma.miniAppUser.delete({ where: { fid: body.fid } });
      console.log("Mini app removed:", body.fid);
      break;

    case "notifications_enabled":
      if (body.notificationDetails) {
        console.log("Notifications enabled:", body.fid);
      }
      break;

    case "notifications_disabled":
      console.log("Notifications disabled:", body.fid);
      break;
  }

  return Response.json({ success: true });
}