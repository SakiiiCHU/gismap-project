"use client"

import { useEffect, useRef } from "react"
import "./FilterPanel.css"

export default function FilterPanel({
  metroData,
  districtData,
  onLineSelect,
  onStationSelect,
  onDistrictSelect,
  onApplyFilter,
  onDataTypeChange,
  selectedMRT,
  selectedStation,
  selectedDistrict,
  selectedLineStations,
  isLoading,
  activeFilterType,
  activeDataType,
  onFilterTypeChange,
}) {
  const lineSelectRef = useRef(null)
  const districtSelectRef = useRef(null)

  // Update dropdown when selectedMRT changes from map
  useEffect(() => {
    console.log("🔄 Updating dropdown value to:", selectedMRT)
    if (lineSelectRef.current) {
      lineSelectRef.current.value = selectedMRT || ""
    }
  }, [selectedMRT])

  // Update Dist. when MapView changes
  useEffect(() => {
    console.log("🏙️ Updating district dropdown to:", selectedDistrict)
    if (districtSelectRef.current) {
      districtSelectRef.current.value = selectedDistrict || ""
    }
  }, [selectedDistrict])

  return (
    <div className="filter-panel bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-lg text-white w-[300px]">
      <div className="filter-header">
        <h2>Filters</h2>
        <div style={{ marginLeft: "auto" }}>
          <button>Clear all</button>
        </div>
      </div>

      <div className="filter-section">
        <div className="data-type-tabs">
          <button
            className={`tab-button ${activeDataType === "courses" ? "active" : ""}`}
            onClick={() => onDataTypeChange("courses")}
          >
            Course
          </button>
          <button
            className={`tab-button ${activeDataType === "exhibition" ? "active" : ""}`}
            onClick={() => onDataTypeChange("exhibition")}
          >
            Exhibit
          </button>
        </div>
      </div>

      <div className="filter-section">
        <span className="py-1">Search By...</span>
        <div className="filter-type-tabs">
          <button
            className={`tab-button ${activeFilterType === "mrt" ? "active" : ""}`}
            onClick={() => onFilterTypeChange("mrt")}
          >
            MRT
          </button>
          <button
            className={`tab-button ${activeFilterType === "district" ? "active" : ""}`}
            onClick={() => onFilterTypeChange("district")}
          >
            行政區
          </button>
        </div>

        {activeFilterType === "mrt" && (
          <div className="filter-section mt-4">
            <div className="dropdown-group">
              <select ref={lineSelectRef} value={selectedMRT || ""} onChange={onLineSelect} className="filter-select">
                <option value="">Select MRT line</option>
                <option value="all">All Lines</option>
                {metroData?.mrt_lines?.map((line) => (
                  <option key={line.line} value={line.line}>
                    {line.line}
                  </option>
                ))}
              </select>

              {selectedMRT && (
                <select
                  value={selectedStation || ""}
                  onChange={(e) => onStationSelect(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Select station</option>
                  <option value="all">All Stations</option>
                  {selectedLineStations?.map((station) => (
                    <option key={station.station_id} value={station.station_id}>
                      {station.name_chinese} {station.name_english}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={onApplyFilter}
                disabled={isLoading || !activeDataType || (!selectedStation && !selectedDistrict)}
                className="apply-button w-full bg-black text-white rounded-full disabled:cursor-not-allowed hover:bg-yellow"
              >
                {isLoading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>
        )}

        {activeFilterType === "district" && (
          <div className="filter-section mt-4">
            <div className="dropdown-group">
              <select
                ref={districtSelectRef}
                value={selectedDistrict || ""}
                onChange={(e) => onDistrictSelect(e.target.value)}
                className="filter-select"
              >
                <option value="">Select district</option>
                <option value="all">All Districts</option>
                {districtData?.features?.map((district) => (
                  <option key={district.properties.TNAME} value={district.properties.TNAME}>
                    {district.properties.TNAME}
                  </option>
                ))}
              </select>

              <button
                onClick={onApplyFilter}
                disabled={isLoading || !activeDataType || !selectedDistrict || selectedDistrict === "all"}
                className="apply-button w-full bg-black text-white rounded-full disabled:cursor-not-allowed hover:bg-yellow"
              >
                {isLoading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
