
import "./FilterResults_light.css"
import { useFetchLocations } from "../hooks/useFetchLocations"
import { useMemo } from "react"

export default function FilterResults({
  filteredLocations,
  selectedDistrict,
  selectedStation,
  selectedLineStations,
  activeFilterType,
  shortestPaths,
  onSelectLocation,
  selectedType, // 新增傳遞 type
  selectedLocationId, // ✅ 傳遞選擇的 `selectedLocationId`
}) {
  //console.log("✅ FilterResults received selectedType:", selectedType) 

  // 排序捷運最近距離
  const shortestPathsSorted = shortestPaths?.features
    ? [...shortestPaths.features].sort((a, b) => a.properties.distance - b.properties.distance)
    : []

  // 取得 locatIds
  const locatIds = useMemo(() => {
    return shortestPathsSorted.map((path) => path.properties.end_name)
  }, [shortestPathsSorted])

  // 透過 hook 獲取 location 資料
  const { locations, loading, error } = useFetchLocations(locatIds, selectedType) // 根據 type 請求資料

  // Helper function to get selected station info
  const getSelectedStationInfo = () => {
    if (!selectedStation || selectedStation === "all" || !selectedLineStations) return null
    return selectedLineStations.find((station) => station.station_id === selectedStation)
  }

  // Helper function to get location details by end_name (locat_id)
  const getLocationDetails = (end_name) => {
    if (!end_name || !filteredLocations) return null
    return filteredLocations.find((loc) => loc.locat_id.toString() === end_name.toString())
  }

  // Helper function to format distance
  const formatDistance = (distance) => {
    if (!distance) return "N/A"
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`
    }
    return `${Math.round(distance)} m`
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const selectedStationInfo = getSelectedStationInfo()

  // Add explicit handler for path card clicks with logging
  const handlePathCardClick = (locatId) => {
    console.log(`Clicked on path card with location ID: ${locatId}`)

    // Find the location with courses/exhibitions data from our fetched locations
    const locationWithData = locations.find((loc) => loc.locat_id.toString() === locatId.toString())

    console.log("Location details for path:", locationWithData)

    if (locationWithData) {
      // Check if we have courses data when in courses mode
      if (selectedType === "courses") {
        const coursesData = locationWithData.courses || locationWithData.course || []
        console.log(`Courses data for location ${locatId}:`, coursesData)

        console.log("🔥 Sending location data to onSelectLocation:", locationWithData)

        // Even if there are no courses, we still want to show the location with a "no courses" message
        onSelectLocation(locationWithData.locat_id, locationWithData)
      } else {
        // For exhibitions or other types, pass the data as is
        onSelectLocation(locationWithData.locat_id, locationWithData)
      }
    } else {
      // Fallback to just the ID if location not found
      onSelectLocation(locatId)
    }
  }

  return (
<div
  className={`filter-results-container ${
    (filteredLocations?.length > 0 || shortestPaths?.features?.length > 0) ? "expanded" : ""
  }`}
>      <div className="filter-results-header">
        <h4 className="text-sm font-medium text-gray-700 tracking-wide">Results</h4>
        <span className="text-sm text-gray-500 tracking-wider">
          {activeFilterType === "district" && filteredLocations.length > 0
            ? `${filteredLocations.length} ${selectedType}`
            : selectedStationInfo && shortestPathsSorted.length > 0
              ? `${shortestPathsSorted.length} ${selectedType} found`
              : "No selection"}
        </span>
      </div>

      <div className="results-scroll-area">
      {activeFilterType === "district" && selectedDistrict && (
  <div className="results-content">
    {filteredLocations?.length > 0 ? (
      filteredLocations.map((location) => (
        <button
          key={location.id}
          className="location-card"
          onClick={() => onSelectLocation(location.locat_id)}
        >
          <div className="location-content">
            <div className="location-info">
              <h3>{location.name}</h3>
              <div className="location-name">{location.locat_name}</div>
              <div className="location-address">{location.address}</div>
            </div>
          </div>
        </button>
      ))
    ) : (
      <div className="no-paths-message">
        {'Click "Apply Filter" to find locations in this district'}
      </div>
    )}
  </div>
)}


        {activeFilterType === "mrt" && selectedStationInfo && (
          <div className="results-content">
            {loading && <div className="loading">Loading locations...</div>}
            {error && <div className="error">Error loading locations</div>}

            {shortestPathsSorted.length > 0 ? (
              <div>
                <div className="section-title">Nearby Places (Walking Distance):</div>
                {shortestPathsSorted.map((path, index) => {
                  const locationDetails = locations.find(
                    (loc) => loc.locat_id.toString() === path.properties.end_name.toString(),
                  )
                  console.log("Location details for path:", locationDetails)
                  return (
                    <button
                      key={index}
                      className="path-card"
                      onClick={() => handlePathCardClick(path.properties.end_name)}
                    >
                      <div className="path-header">
                        <span className="path-number">#{index + 1}</span>
                        <span className="path-distance">{formatDistance(path.properties.distance)}</span>
                      </div>
                      {locationDetails ? (
                        <div className="location-details">
                          <div className="location-name font-medium text-base">{locationDetails.locat_name}</div>
                          <div className="location-address text-sm text-gray-600 mb-2">{locationDetails.address}</div>

                          {/* 顯示展覽或課程 */}
                          {selectedType === "exhibition" && locationDetails.exhibitions && (
                            <div className="location-exhibitions">
                              <div className="font-medium mb-1">Exhibitions:</div>
                              <div className="space-y-3">
                                {locationDetails.exhibitions.map((exhibition, index) => (
                                  <div
                                    key={`exhibition-${exhibition.e_id || index}`}
                                    className="exhibition-item border-l-2 border-blue-500 pl-2"
                                  >
                                    <div className="exhibition-name font-medium">{exhibition.e_name}</div>
                                    <div className="exhibition-dates">
                                      {formatDate(exhibition.e_startdate)} - {formatDate(exhibition.e_enddate)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedType === "courses" && (locationDetails.courses || locationDetails.course) && (
                            <div className="location-courses">
                              <div className="font-medium mb-1">Courses:</div>
                              <div className="space-y-3">
                                {(locationDetails.courses || locationDetails.course || []).map((course, index) => (
                                  <div
                                    key={`course-${course.c_id || index}`}
                                    className="course-item border-l-2 border-green-500 pl-2"
                                  >
                                    <div className="course-name font-medium">{course.c_name || course.name}</div>
                                    <div className="course-dates text-xs text-gray-600">
                                      {formatDate(course.c_startdate || course.startdate)} -{" "}
                                      {formatDate(course.c_enddate || course.enddate)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="location-details">
                          <div className="location-id">ID: {path.properties.end_name}</div>
                          <div className="location-name">Location details not found</div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : selectedStation && selectedStation !== "all" ? (
                Array.isArray(shortestPaths?.features) ? (
                  // 已送出但查無結果
                    <div className="no-paths-message">
                    No exhibitions or courses found near this station.
                  </div>
                ) : (
                  // 尚未送出
                  <div className="no-paths-message">
                    Click "Apply Filter" to find nearest locations
                  </div>
                )
              ) : null}
                        </div>
        )}

        {!selectedDistrict && !selectedStationInfo && <div className="no-selection">No selection made</div>}
      </div>
    </div>
  )
}
