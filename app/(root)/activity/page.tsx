import { currentUser } from "@clerk/nextjs"
import { redirect } from 'next/navigation'

import { fetchUser, getActivity } from "@/lib/actions/user.actions"
import Link from "next/link"
import Image from "next/image"

const Page = async () => {
  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect('/onboarding')

  // get activity
  const activity = await getActivity(userInfo._id)

  return (
    <section>
      <h1 className="head-text text-left">Activity</h1>

      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          <>
            {activity.map((act) => {
              console.log(act)
              return (
              <Link
                key={act._id}
                href={`/thread/${act.parentId}`}
              >
                <article className="activity-card">
                  <Image
                    src={act.author.image}
                    alt={act.title}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {act.author.name}
                    </span>{ " " }
                    replied to your thread
                  </p>
                </article>
              </Link>
            )})}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No activity yet</p>
        )}
              
      </section>
    </section>
  )
}

export default Page
