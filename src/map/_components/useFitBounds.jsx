import { useEffect, useRef } from "react"
import L from "leaflet"

export const useFitBounds = ({
  mapRef,
  shortestPaths,
  filteredLocations,
  selectedDistrict,
  selectedStation,
  selectedLineStations,
  taipeiDistricts,
  mrtRoutes,
  activeFilterType,
}) => {
  const prevState = useRef({
    type: null,
    station: null,
    district: null,
    shortestCount: 0,
    filteredCount: 0,
  })

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    
    // console.log('filteredLocations identity:', filteredLocations)


    const options = {
      padding: [40, 40],
      animate: true,
      duration: 1,
      maxZoom: 15,
      minZoom: 11,
    }

    let bounds = L.latLngBounds()

    // =========================
    // ① 剛切換 → MRT 顯示所有捷運線
    // =========================
    if (activeFilterType === "mrt" && prevState.current.type !== "mrt") {
      if (mrtRoutes?.features?.length) {
        mrtRoutes.features.forEach((route) => {
          if (route.geometry.type === "MultiLineString") {
            route.geometry.coordinates.forEach((line) => {
              line.forEach((coord) => bounds.extend([coord[1], coord[0]]))
            })
          } else if (route.geometry.type === "LineString") {
            route.geometry.coordinates.forEach((coord) => bounds.extend([coord[1], coord[0]]))
          }
        })
        if (bounds.isValid()) map.fitBounds(bounds, options)
      }
    }

    // =========================
    // ② 剛切換 → District 顯示所有行政區
    // =========================
    else if (activeFilterType === "district" && prevState.current.type !== "district") {
      if (taipeiDistricts?.features?.length) {
        taipeiDistricts.features.forEach((feature) => {
          if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon.forEach((ring) => {
                ring.forEach((coord) => bounds.extend([coord[1], coord[0]]))
              })
            })
          } else if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates.forEach((ring) => {
              ring.forEach((coord) => bounds.extend([coord[1], coord[0]]))
            })
          }
        })
        if (bounds.isValid()) map.fitBounds(bounds, options)
      }
    }

    // =========================
    // ③ 有資料變動 → MRT 模式 fit 資料
    // =========================
    else if (activeFilterType === "mrt") {
      const changed =
        prevState.current.shortestCount !== (shortestPaths?.features?.length || 0) ||
        prevState.current.station !== selectedStation

      if (changed) {
        if (shortestPaths?.features?.length) {
          shortestPaths.features.forEach((path) => {
            path.geometry?.coordinates?.[0]?.forEach((coord) => bounds.extend([coord[1], coord[0]]))
          })
          if (bounds.isValid()) map.fitBounds(bounds, options)
        } else if (selectedLineStations?.length) {
          selectedLineStations.forEach((s) =>
            bounds.extend([s.coordinates.latitude, s.coordinates.longitude])
          )
          if (bounds.isValid()) map.fitBounds(bounds, options)
        } else if (selectedStation && selectedLineStations?.length) {
          const station = selectedLineStations.find((s) => s.station_id === selectedStation)
          if (station) {
            map.setView(
              [station.coordinates.latitude, station.coordinates.longitude],
              15,
              { animate: true, duration: 1 }
            )
          }
        }
      }
    }

    // =========================
    // ④ 有資料變動 → District 模式 fit 資料
    // =========================
    else if (activeFilterType === "district") {
      const changed =
        prevState.current.filteredCount !== (filteredLocations?.length || 0) ||
        prevState.current.district !== selectedDistrict

      if (changed) {
        if (filteredLocations?.length) {
          filteredLocations.forEach((loc) => {
            if (loc.latitude && loc.longitude) {
              bounds.extend([+loc.latitude, +loc.longitude])
            }
          })
          if (bounds.isValid()) map.fitBounds(bounds, options)
        } else if (selectedDistrict && taipeiDistricts?.features) {
          const districtFeature = taipeiDistricts.features.find(
            (f) => f.properties.TNAME === selectedDistrict
          )
          if (districtFeature) {
            const geoJsonLayer = L.geoJSON(districtFeature)
            bounds = geoJsonLayer.getBounds()
            if (bounds.isValid()) map.fitBounds(bounds, options)
          }
        }
      }
    }

    // 更新狀態記錄
    prevState.current = {
      type: activeFilterType,
      station: selectedStation,
      district: selectedDistrict,
      shortestCount: shortestPaths?.features?.length || 0,
      filteredCount: filteredLocations?.length || 0,
    }
  }, [
    mapRef,
    activeFilterType,
    shortestPaths,
    filteredLocations,
    selectedDistrict,
    selectedStation,
    selectedLineStations,
    taipeiDistricts,
    mrtRoutes,
  ])
}
