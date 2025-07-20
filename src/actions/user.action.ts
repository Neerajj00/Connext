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

export async function getRandomUser(){
    try {
        const userId = await getDbUserId();

        // get 3 random users excluding the current user and user that we already follow
        const randomUsers = await prisma.user.findMany({
            where:{
                AND:[
                    {
                        NOT:{id: userId}
                    },{
                        NOT:{followers: {some: {followerId: userId}}}
                    }
                ]
            },
            select:{
                id: true,
                name: true,
                username: true,
                image: true,
                _count:{
                    select:{
                        followers: true,
                    }
                }
            },
            take: 3,
        })

        return randomUsers;

    } catch (error) {
        console.error("Error fetching random users:", error);
        return []; // Return an empty array in case of error
    }
}

export async function toggleFollow(targetUserId: string) {
    try {
        const userId = await getDbUserId();
        if(!userId) throw new Error("User not authenticated");
        if(userId === targetUserId) {
            throw new Error("You cannot follow yourself");
        }

        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        })

        if(existingFollow) {
            // Unfollow the user
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }
            });
        }else{
            await prisma.$transaction([
                prisma.follows.create({
                    data:{
                        followerId: userId,
                        followingId: targetUserId
                    }
                }),

                prisma.notification.create({
                    data:{
                        type: "FOLLOW",
                        userId: targetUserId,
                        creatorId: userId,
                    }
                })
            ])
        }

        return {success:true};

    } catch (error) {
        console.error("Error toggling follow:", error);
        return {success:false, error: "Failed to toggle follow"};
    }
}