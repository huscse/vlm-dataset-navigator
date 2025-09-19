export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          VLM-Driven{' '}
          <span className="relative text-blue-600 inline-block">
            Open Dataset
            <span className="absolute left-0 -bottom-1 md:-bottom-2 w-full h-0.5 md:h-1 bg-blue-600 rounded-full" />
          </span>{' '}
          Navigator
        </h1>

        <p className="mt-4 md:mt-5 text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-1">
          Search driving datasets with natural language
        </p>
      </div>
    </div>
  );
}
