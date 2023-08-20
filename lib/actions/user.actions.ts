"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import { FilterQuery, SortOrder } from "mongoose"

interface Params {
  userId: string
  username: string
  name: string
  bio: string
  image: string
  path: string
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {

  connectToDB()

  try {
    await User.findOneAndUpdate(
      { id: userId },
      { 
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true },
    )

    if(path === '/profile/edit') {
      revalidatePath(path)
    }
  } catch (err: any) {
    throw new Error(`Failed to create/update user: ${err.message}`)
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();
    return await User
      .findOne({ id: userId })
      // .populate({
      //   path: 'communities',
      //   model: 'Community',
      // })
  } catch (err: any) {
    throw new Error(`Failed to fetch user: ${err.message}`)
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // TODO: populate communities

    return await User
      .findOne({ id: userId })
      .populate({
        path: 'threads',
        model: Thread,
        populate: {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: 'name image id'
          }
        }
      })
  } catch (err: any) {
    throw new Error(`Failed to fetch user posts: ${err.message}`)
  }
}

export async function fetchUsers({
  userId,
  searchString = '',
  pageNumber = 1,
  pageSize = 20,
  sortBy = 'desc',
} : {
  userId: string
  searchString?: string
  pageNumber?: number
  pageSize?: number
  sortBy?: SortOrder
}) {
  try {
    connectToDB();

    const skip = (pageNumber - 1) * pageSize

    const regex = new RegExp(searchString, 'i')

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    }

    if(searchString.trim() !== '') {
      query.$or = [
        { username: regex },
        { name: regex },
      ]
    }

    const sortOptions = { createdAt: sortBy }
    const usersQuery = User
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)

    const totalUsersCount = await User.countDocuments(query)
    const users = await usersQuery.exec()

    const isNext = totalUsersCount > skip + users.length

    return { users, isNext }
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    //find all threads created by the user
    const threads = await Thread
      .find({ author: userId })

    // find all the child thread ids (replies) from the children field
    const childThreadIds = threads.reduce((acc, thread) => {
      return acc.concat(thread.children)
    })

    const replies = await Thread
      .find({ 
        _id: { $in: childThreadIds },
        author: { $ne: userId },
      })
      .populate({
        path: 'author',
        model: User,
        select: 'name image _id'
      })

    return replies
    
  } catch (error: any) {
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }
}
