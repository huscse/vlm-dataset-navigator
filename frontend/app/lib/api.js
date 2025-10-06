const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function searchDatasets(query) {
  if (API_BASE) {
    const res = await fetch(
      `${API_BASE.replace(/\/$/, '')}/search?query=${encodeURIComponent(
        query,
      )}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const data = await res.json();
    return data.results ?? [];
  }

  // mock mode (no backend yet)
  await new Promise((r) => setTimeout(r, 500));
  return [
    {
      id: 'mock-1',
      title: `Result for "${query}" — red light near intersection`,
      snippet: 'Vehicle approaches red light; pedestrian steps off curb.',
      dataset: 'nuScenes',
      thumbnailUrl:
        'https://dummyimage.com/400x225/eeeeee/aaaaaa.png&text=Frame+Preview',
      timestampSec: 12,
    },
    {
      id: 'mock-2',
      title: `Result for "${query}" — cyclist overtaking on right`,
      snippet: 'Cyclist passes vehicle; potential near-miss with opening door.',
      dataset: 'Waymo',
      thumbnailUrl:
        'https://dummyimage.com/400x225/eeeeee/aaaaaa.png&text=Frame+Preview',
      timestampSec: 47,
    },
  ];
}
