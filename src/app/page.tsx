import Link from "next/link";
import { LatestPost } from "~/app/_components/post";
import { LandingPage } from "~/app/_components/landing";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {session?.user ? <LoggedInLanding session={session} /> : <LandingPage />}
    </HydrateClient>
  );
}

function LoggedInLanding({ session }: { session: any }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Welcome Back, {session.user.name}!
        </h1>
        <Link
          href="/dashboard"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/api/auth/signout"
          className="rounded-full bg-red-500 px-10 py-3 font-semibold no-underline transition hover:bg-red-600"
        >
          Sign out
        </Link>
        <LatestPost />
      </div>
    </main>
  );
}
