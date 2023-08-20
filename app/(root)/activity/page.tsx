import { currentUser } from "@clerk/nextjs"
import { redirect } from 'next/navigation'

import { fetchUser } from "@/lib/actions/user.actions"

const Page = async () => {
  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)
  if (!userInfo?.onboarded) redirect('/onboarding')

  // get activity

  return (
    <section>
      <h1>Activity</h1>
    </section>
  )
}

export default Page
