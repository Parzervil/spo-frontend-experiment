import Link from 'next/link';

export default function Home() {
  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold">世界观共创平台</h1>
        <p className="text-lg text-gray-500 max-w-xl">
          基于无头 CMS 架构，由 GitHub 驱动的多人协作讨论、创作与研究一体化工作台。
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10"
            href="/dashboard"
          >
            进入工作台
          </Link>
          <a
            href={loginUrl}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10 gap-2 cursor-pointer"
          >
            GitHub 登录
          </a>
        </div>
      </main>
    </div>
  );
}
