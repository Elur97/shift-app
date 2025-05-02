import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[url('/images/background.jpeg')] bg-cover bg-center flex flex-col items-center justify-center text-gray-800">
      <div className="bg-white border-4 p-8 rounded-lg shadow-lg text-center space-y-6">
        <h1 className="md:text-8xl text-6xl font-bold">ShiftBase</h1>
        <p className="font-bold md:text-2xl text-xl">従業員と店長の仕事を効率化するシフト管理ツールです</p>
        <div className="flex justify-center text-2xl space-x-6">
          <Link href="/signup">
            <button className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
              新規登録
            </button>
          </Link>
          <Link href="/login">
            <button className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
              ログイン
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
