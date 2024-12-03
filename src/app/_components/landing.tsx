import Link from "next/link";

export function LandingPage() {
    return (
        <div className="bg-[#f8fafc] min-h-screen">
            <header className="sticky top-0 z-50 bg-white shadow-md">
                <div className="flex items-center justify-between px-12 py-6">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center text-2xl font-bold hover:text-inherit">
                            <img src="/favicon.png" alt="AirTable Logo" className="h-9 w-9 mr-2" />
                            AirTable
                        </Link>
                        <nav className="hidden md:flex gap-6 font-semibold">
                            <Link href="#">Platform</Link>
                            <Link href="#">Solutions</Link>
                            <Link href="#">Resources</Link>
                            <Link href="#">Enterprise</Link>
                            <Link href="#">Pricing</Link>
                        </nav>
                    </div>
                    <Link
                        href="/api/auth/signin"
                        className="text-lg font-semibold"
                    >
                        Sign in
                    </Link>
                </div>
            </header>

            <section
                className="relative bg-cover bg-center"
                style={{ backgroundImage: "url('/landingback.webp')" }}
            >

                <div className="absolute inset-0 bg-white/0.5 backdrop-blur-xs pointer-events-none"></div>

                <div className=" mx-auto flex items-center justify-center">
                    <div className="flex flex-col items-start max-w-2xl pl-10">
                        <h2 className="text-6xl font-bold mb-4 leading-tight">
                            Digital operations <br />
                            <span className="">for the AI era</span>
                        </h2>

                        <p className="text-xl mb-8">
                            Create modern business apps to manage and automate critical processes.
                        </p>
                        <Link
                            href="/api/auth/signin"
                            className="inline-block bg-blue-700 text-white text-lg font-semibold px-8 py-2 rounded-lg hover:bg-blue-900 hover:text-white transition"
                        >
                            Sign up for free
                        </Link>

                    </div>

                    <img
                        src="/landing.webp"
                        alt="Promotional Graphic"
                        className="max-w-5xl"
                    />
                </div>
            </section>

            <section className="mx-auto flex justify-center gap-12 py-16">
                <img src="aws.svg" alt="AWS Logo" className="h-8 object-contain" />
                <img src="wallmart.svg" alt="Walmart Logo" className="h-8 object-contain" />
                <img src="hbo.svg" alt="HBO Logo" className="h-8 object-contain" />
                <img src="time.svg" alt="Time Logo" className="h-8 object-contain" />
                <img src="blackrock.svg" alt="BlackRock Logo" className="h-8 object-contain" />
            </section>
        </div>
    );
}
