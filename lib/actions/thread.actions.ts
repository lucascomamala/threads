"use server"

import { connectToDB } from "../mongoose"
import { revalidatePath } from "next/cache"

import Thread from "../models/thread.model"
import User from "../models/user.model"

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createThread({ text, author, communityId, path }: Params) {
  try {
    connectToDB()

    const createdThread =  await Thread.create({
      text,
      author,
      community: null,
    })

    // Update user model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id }
    })

    revalidatePath(path)
  } catch (err: any) {
    throw new Error(`Failed to create thread: ${err.message}`)
  }
}

export async function fetchThreads(pageNum = 1, pageSize = 20) {
  connectToDB()

  // Calculate the skip value
  const skip = (pageNum - 1) * pageSize
  
  // Fetch the posts that have no parents (Top level Threads)
  const postsQuery = Thread.find({ parent: { $in: [null, undefined]}})
    .sort({ createdAt: 'desc' })
    .skip(skip)
    .limit(pageSize)
    .populate({ path: 'author', model:User})
    .populate({
      path: 'children',
      populate: {
        path: 'author',
        model: User,
        select: '_id name parentId image'
      }
    })

  const totalPostsCount = await Thread.countDocuments({ parent: { $in: [null, undefined] } })

  const posts = await postsQuery

  const isNext = totalPostsCount > pageNum * pageSize

  return { posts, isNext }
}

export async function fetchThreadById(id: string) {
  connectToDB()
  try {
    // TODO: Populate community
    const thread = await Thread.findById(id)
      .populate({ 
        path: 'author', 
        model: User,
        select: '_id  id name image'
      })
      .populate({
        path: 'children',
        model: Thread,
        populate: {
          path: 'author',
          model: User,
          select: '_id name parentId image'
        }
      })

    return thread
  } catch (error: any) {
    throw new Error(`Failed to fetch thread by id: ${error.message}`)
  }
  
}
