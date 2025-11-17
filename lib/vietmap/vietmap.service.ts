// Decode polyline from VietMap API
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
  
    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;
  
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;
  
      points.push({
        lat: lat * 1e-5,
        lng: lng * 1e-5,
      });
    }
  
    return points;
  }
  
  // Get route from VietMap API
  export async function getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    apiKey: string
  ): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
    try {
      const baseUrl = 'https://maps.vietmap.vn/api/route';
      const params = new URLSearchParams({
        'api-version': '1.1',
        apikey: apiKey,
        points_encoded: 'true',
        vehicle: 'car'
      });
      
      params.append('point', `${origin.lat},${origin.lng}`);
      params.append('point', `${destination.lat},${destination.lng}`);
  
      const url = `${baseUrl}?${params}`;
      const response = await fetch(url);
  
      if (!response.ok) {
        console.error('VietMap Route API error:', response.status, response.statusText);
        return null;
      }
  
      const data = await response.json();
  
      if (data.code !== 'OK' || !data.paths || data.paths.length === 0) {
        console.error('VietMap Route API error:', data.messages || 'No paths found');
        return null;
      }
  
      const path = data.paths[0];
      const decodedPoints = decodePolyline(path.points);
      
      // convert to format [longitude, latitude] for MapView
      const coordinates: [number, number][] = decodedPoints.map(point => [point.lng, point.lat]);
  
      return {
        coordinates,
        distance: path.distance / 1000, // km
        duration: path.time / 1000, // seconds
      };
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  }