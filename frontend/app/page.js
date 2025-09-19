export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          VLM-Driven{' '}
          <span className="relative text-blue-600 inline-block">
            Open Dataset
            <span className="absolute left-0 -bottom-2 w-full h-1 bg-blue-600 rounded-full"></span>
          </span>{' '}
          Navigator
        </h1>
        <p className="mt-5 text-gray-600 text-lg">
          Search driving datasets with natural language
        </p>
      </div>
    </div>
  );
}
