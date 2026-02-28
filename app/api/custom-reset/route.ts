import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, password } = body;
        const payload = await getPayload({ config });

        console.log("=== CUSTOM RESET START ===");
        console.log("Received Token:", token);
        console.log("Password length:", password?.length);

        // 1. Manually query the DB for this exact token
        const users = await payload.find({
            collection: "users",
            where: {
                resetPasswordToken: {
                    equals: token,
                },
            },
            showHiddenFields: true,
            limit: 1,
        });

        console.log("Users found by token string:", users.totalDocs);

        if (users.docs.length === 0) {
            // Print what's actually in DB for debugging
            const allUsers = await payload.find({
                collection: "users",
                showHiddenFields: true,
                limit: 1,
            });
            console.log("DB CURRENT TOKEN for user 0:", (allUsers.docs[0] as any)?.resetPasswordToken);
            console.log("DB CURRENT EXPIRY for user 0:", (allUsers.docs[0] as any)?.resetPasswordExpiration);

            return NextResponse.json({ success: false, message: "Invalid or expired link: Token mismatch." }, { status: 400 });
        }

        const user = users.docs[0] as any;
        const now = new Date();
        const expiry = new Date(user.resetPasswordExpiration);

        console.log("Token Expiry:", expiry.toISOString());
        console.log("Now:", now.toISOString());

        if (expiry < now) {
            return NextResponse.json({ success: false, message: "Invalid or expired link: Token has expired." }, { status: 400 });
        }

        // 3. Actually reset the password using Payload API
        await payload.resetPassword({
            collection: "users",
            overrideAccess: true,
            data: {
                token: token,
                password: password,
            },
        });

        console.log("=== RESET SUCCESSFUL ===");
        return NextResponse.json({ success: true, message: "Password reset successfully!" });

    } catch (error: any) {
        console.error("=== CUSTOM RESET ERROR ===", error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
