export const calcBounds = (
  points: { lat: number; lng: number }[]
): [[number, number], [number, number]] => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLng = Math.max(maxLng, p.lng);
    maxLat = Math.max(maxLat, p.lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};
