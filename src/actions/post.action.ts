"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content:string, imageUrl:string){
    try {
        const userId = await getDbUserId();
        if(!userId) return;
        const post = await prisma.post.create({
            data:{
                content,
                image: imageUrl,
                authorId: userId
            }
        })

        revalidatePath("/");
        return {success: true, post};
    } catch (error) {
        return {success: false, error: "Failed to create post"};
    }
}

export async function getPosts(){
    try {
        const posts = await prisma.post.findMany({
            orderBy:{
                createdAt: "desc"
            },
            include:{
                author:{
                    select:{
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            }
                        }
                    },
                    orderBy:{
                        createdAt: "asc"
                    }
                },
                likes:{
                    select:{
                        id: true,
                        userId: true,
                    }
                },
                _count:{
                    select:{
                        comments: true,
                        likes: true,
                    }
                }
            }
        })

        return posts
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw new Error("Failed to fetch posts");
    }
}