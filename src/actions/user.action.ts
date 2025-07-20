"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
    try{
        const {userId} = await auth();
        const user = await currentUser();

        if(!user || !userId) return;

        // Check if the user already exists in the database
        const existingUser = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        // If the user already exists, return it
        if(existingUser) return existingUser;

        const dbuser = await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName || " " } ${user.lastName || " "}`,
                username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl,
            }
        })

        return dbuser; 

    }catch (error) {
        console.error("Error syncing user:", error);
        throw new Error("Failed to sync user data");
    }
}

export async function getUserByClerkId(clerkId:string) {
    return prisma.user.findUnique({
        where: { clerkId: clerkId },
        include:{
            _count:{
                select:{
                    posts: true,
                    followers: true,
                    following: true,
                }
            }
        }
    })
}

export async function getDbUserId(){
    const {userId:clerkId} = await auth();
    if(!clerkId) throw new Error("User not authenticated");

    const user = await getUserByClerkId(clerkId);
    if(!user) throw new Error("User not found (user action.ts)");
    return user.id;

}