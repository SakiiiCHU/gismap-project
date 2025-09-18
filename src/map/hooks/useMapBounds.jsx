
import { useCallback } from "react"
import L from "leaflet"

export function useMapBounds() {
  const fitMapToFeatures = useCallback((map, features, instant = true) => {
    if (!map || !features) return

    let bounds
    if (Array.isArray(features)) {
      // Handle array of points (e.g., stations)
      const validPoints = features.filter((f) => f && f.coordinates?.latitude && f.coordinates?.longitude)

      if (validPoints.length > 0) {
        bounds = L.latLngBounds(validPoints.map((f) => [f.coordinates.latitude, f.coordinates.longitude]))
      } else {
        // Try alternative structure (direct lat/lng)
        const directPoints = features.filter((f) => f && f.latitude && f.longitude)
        if (directPoints.length > 0) {
          bounds = L.latLngBounds(directPoints.map((f) => [f.latitude, f.longitude]))
        }
      }
    } else if (features.type === "FeatureCollection") {
      bounds = L.geoJSON(features).getBounds()
    } else if (features.type === "Feature") {
      bounds = L.geoJSON(features).getBounds()
    } else if (features.geometry) {
      // Single GeoJSON feature
      bounds = L.geoJSON({
        type: "Feature",
        geometry: features.geometry,
        properties: features.properties || {},
      }).getBounds()
    }

    if (!bounds || !bounds.isValid()) {
      console.warn("Could not determine bounds for features:", features)
      return
    }

    const options = {
      padding: [50, 50],
      maxZoom: 16, // 最大縮放等級 Prevent excessive zoom
      animate: !instant,
      duration: 1,
    }

    if (instant) {
      map.fitBounds(bounds, options)
    } else {
      map.flyToBounds(bounds, options)
    }
  }, [])

  return { fitMapToFeatures }
}

