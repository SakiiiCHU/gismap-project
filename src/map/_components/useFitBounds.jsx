"use client"

import { useEffect } from "react"
import L from "leaflet"

export const useFitBounds = ({
  mapRef,
  shortestPaths,
  filteredLocations,
  selectedDistrict,
  selectedMRT,
  selectedStation,
  selectedLineStations,
  taipeiDistricts,
  mrtRoutes,
  activeFilterType,
}) => {
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Handle bounds fitting based on active filter type
    if (activeFilterType === "mrt") {
      // MRT filter mode - fit to shortest paths or selected line stations
      if (shortestPaths?.features?.length) {
        // Fit to shortest paths
        const bounds = []
        shortestPaths.features.forEach((path) => {
          if (path.geometry?.coordinates?.[0]) {
            path.geometry.coordinates[0].forEach((coord) => {
              bounds.push([coord[1], coord[0]]) // [lat, lng]
            })
          }
        })

        if (bounds.length > 0) {
          const leafletBounds = L.latLngBounds(bounds)
          map.fitBounds(leafletBounds, { padding: [20, 20] })
        }
      } else if (selectedLineStations?.length) {
        // Fit to selected line stations
        const bounds = selectedLineStations.map((station) => [
          station.coordinates.latitude,
          station.coordinates.longitude,
        ])

        if (bounds.length > 0) {
          const leafletBounds = L.latLngBounds(bounds)
          map.fitBounds(leafletBounds, { padding: [20, 20] })
        }
      } else if (selectedStation && selectedLineStations?.length) {
        // Fit to specific station
        const station = selectedLineStations.find((s) => s.station_id === selectedStation)
        if (station) {
          map.setView([station.coordinates.latitude, station.coordinates.longitude], 15)
        }
      }
    } else if (activeFilterType === "district") {
      // District filter mode - fit to district or filtered locations
      if (filteredLocations?.length) {
        // Fit to filtered locations
        const bounds = filteredLocations
          .filter((loc) => loc.latitude && loc.longitude)
          .map((loc) => [Number.parseFloat(loc.latitude), Number.parseFloat(loc.longitude)])

        if (bounds.length > 0) {
          const leafletBounds = L.latLngBounds(bounds)
          map.fitBounds(leafletBounds, { padding: [20, 20] })
        }
      } else if (selectedDistrict && taipeiDistricts) {
        // Fit to selected district
        const districtFeature = taipeiDistricts.features?.find(
          (feature) => feature.properties.TNAME === selectedDistrict,
        )

        if (districtFeature) {
          const geoJsonLayer = L.geoJSON(districtFeature)
          const bounds = geoJsonLayer.getBounds()
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      }
    }
  }, [
    mapRef,
    shortestPaths,
    filteredLocations,
    selectedDistrict,
    selectedMRT,
    selectedStation,
    selectedLineStations,
    taipeiDistricts,
    mrtRoutes,
    activeFilterType,
  ])
}
